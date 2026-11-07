import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
} from "@nestjs/common";
import { and, asc, eq, gt, inArray, isNull, lt, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  collectHtmlMentions,
  DocType,
  RelationEntityType,
  readTaskRecurrence,
  sumIntervalSeconds,
  TaskPriority,
  TaskStatus,
} from "@repo/api/todex";
import type {
  CreateTaskBody,
  DeleteTaskBody,
  ListTasksQuery,
  MoveTaskBody,
  TaskConflict,
  TaskRecurrence,
  UpdateTaskBody,
} from "@repo/api/todex";

import { DRIZZLE_DB } from "../../db/tokens";
import {
  conversations,
  docs,
  docTasks,
  executionQueue,
  executionSessionTasks,
  taskLifecycleLocks,
  taskReferences,
  taskScheduleSlots,
  tasks,
  workspaces,
  type TaskRow,
} from "../../db/schema";
import { mapTask, parseIsoDate, toIso } from "../../db/mappers";
import {
  formatTaskKey,
  hasParentCycle,
} from "../../helpers/parent-cycle.helper";
import { sanitizeTaskHtml } from "../../helpers/sanitize-task-html.helper";
import { EpicsService } from "../epics/epics.service";
import { resolveTaskEpicLink } from "../epics/task-epic-link";
import { RelationsService } from "../relations/relations.service";
import { SpacesService } from "../spaces/spaces.service";
import { ContentIndexQueue } from "../content-index/content-index.queue";
import { WorkspaceService } from "../workspace/workspace.service";
import { resolveTaskPlacement, TaskPlacementError } from "./task-placement";
import { assertScheduleSlots } from "./task-slots";
import {
  assertNoLiveLifecycleLock,
  executionIsActive,
  hasLiveLock,
  LIFECYCLE_LEASE_MS,
  lockTaskRows,
  parentIdsForChildSet,
  refreshLease,
  TaskLifecycleException,
} from "./task-lifecycle";
import { RecurrenceService } from "./recurrence.service";

@Injectable()
export class TasksService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly spacesService: SpacesService,
    private readonly epicsService: EpicsService,
    private readonly relations: RelationsService,
    private readonly workspaceService: WorkspaceService,
    @Optional() private readonly contentIndex?: ContentIndexQueue,
    @Optional() private readonly recurrence?: RecurrenceService,
  ) {}

  async list(workspaceId: string, query: ListTasksQuery) {
    if (query.scheduleFrom || query.scheduleTo) {
      throw new BadRequestException(
        "Use the schedule range response for scheduleFrom and scheduleTo",
      );
    }
    return this.listFiltered(workspaceId, query);
  }

  async create(workspaceId: string, body: CreateTaskBody, userId: string) {
    await this.spacesService.requireInWorkspace(workspaceId, body.spaceId);
    if (body.parentTaskId) {
      await this.requireTaskInWorkspace(workspaceId, body.parentTaskId);
    }
    if (body.recurrence && body.parentTaskId) {
      throw new BadRequestException("Only root tasks can repeat");
    }
    const placement = await this.placementFor(null, body.spaceId, body);
    const epicId = await this.epicLinkFor(
      workspaceId,
      null,
      body.spaceId,
      body,
    );

    const created = await this.db.transaction(async (tx) => {
      if (body.parentTaskId) {
        await this.assertTaskDepth(tx, workspaceId, null, body.parentTaskId);
        await assertNoLiveLifecycleLock(tx, [body.parentTaskId]);
      }
      const [workspace] = await tx
        .update(workspaces)
        .set({
          taskSeq: sql`${workspaces.taskSeq} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, workspaceId))
        .returning();
      if (!workspace) throw new ForbiddenException();

      const now = new Date();
      const status = body.status ?? TaskStatus.TODO;
      const parentTaskId = body.parentTaskId ?? null;
      const position = parentTaskId
        ? 0
        : await this.nextRootPosition(tx, workspaceId, body.spaceId, status);
      const [row] = await tx
        .insert(tasks)
        .values({
          id: randomUUID(),
          workspaceId,
          spaceId: body.spaceId,
          taskKey: formatTaskKey(workspace.taskSeq),
          summary: body.summary,
          description: sanitizeTaskHtml(body.description ?? ""),
          outcome: body.outcome?.trim() ?? "",
          status,
          priority: body.priority ?? TaskPriority.MEDIUM,
          complexity: body.complexity ?? null,
          dueDate: parseIsoDate(body.dueDate),
          estimation: body.estimation,
          acceptanceCriteria: body.acceptanceCriteria ?? [],
          recurrence: body.parentTaskId ? null : (body.recurrence ?? null),
          ownerId: userId,
          overriddenFields: [],
          version: 1,
          sectionId: placement.sectionId,
          progressStageId: placement.progressStageId,
          epicId,
          parentTaskId,
          position,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (row && body.scheduleSlots) {
        await this.replaceSlots(tx, row, body.scheduleSlots);
      }
      return row;
    });

    if (!created) throw new ForbiddenException();
    await this.relations.replaceReferences(
      this.db,
      workspaceId,
      "task",
      created.id,
      collectHtmlMentions(created.description),
    );
    await this.scheduleIndex(workspaceId, created.id);
    return mapTask(created);
  }

  async update(workspaceId: string, taskId: string, body: UpdateTaskBody) {
    const existing = await this.requireTaskInWorkspace(workspaceId, taskId);

    if (body.spaceId) {
      await this.spacesService.requireInWorkspace(workspaceId, body.spaceId);
    }
    const destinationSpaceId = body.spaceId ?? existing.spaceId;
    const placement = await this.placementFor(
      existing,
      destinationSpaceId,
      body,
    );
    const epicId = await this.epicLinkFor(
      workspaceId,
      existing,
      destinationSpaceId,
      body,
    );

    const nextParentId =
      body.parentTaskId !== undefined ? body.parentTaskId : existing.parentTaskId;
    const spaceChanged = destinationSpaceId !== existing.spaceId;
    const clearsParent = Boolean(existing.parentTaskId) && spaceChanged;
    if (body.parentTaskId !== undefined || clearsParent) {
      await this.assertAcyclic(
        workspaceId,
        taskId,
        clearsParent ? null : (body.parentTaskId ?? null),
      );
      if (body.parentTaskId) {
        await this.requireTaskInWorkspace(workspaceId, body.parentTaskId);
      }
    }
    if (body.recurrence && (existing.parentTaskId || body.parentTaskId)) {
      throw new BadRequestException("Only root tasks can repeat");
    }
    const closing =
      (body.status === TaskStatus.DONE || body.status === TaskStatus.CANCELLED) &&
      body.status !== existing.status;

    const [updated] = await this.db.transaction(async (tx) => {
      if (existing.parentTaskId && body.status && body.status !== existing.status) {
        await lockTaskRows(tx, [existing.id, existing.parentTaskId].sort());
        if (await hasLiveLock(tx, [existing.parentTaskId])) {
          throw new TaskLifecycleException("lifecycle_in_progress");
        }
      }
      const parents = await parentIdsForChildSet(
        tx,
        existing.id,
        clearsParent ? null : nextParentId,
      );
      if (
        body.parentTaskId !== undefined ||
        clearsParent ||
        (body.parentTaskId && body.parentTaskId !== existing.parentTaskId)
      ) {
        await this.assertTaskDepth(
          tx,
          workspaceId,
          existing.id,
          clearsParent ? null : (body.parentTaskId ?? existing.parentTaskId),
        );
        await assertNoLiveLifecycleLock(tx, parents);
      }
      if (closing) {
        if (!body.transitionId) {
          throw new BadRequestException("transitionId is required");
        }
        await this.commitLifecycle(tx, {
          workspaceId,
          task: existing,
          action: body.status === TaskStatus.DONE ? "done" : "cancelled",
          version: body.version,
          transitionId: body.transitionId,
        });
      }
      const [row] = await tx
        .update(tasks)
        .set({
          ...(body.spaceId !== undefined ? { spaceId: body.spaceId } : {}),
          sectionId: placement.sectionId,
          progressStageId: placement.progressStageId,
          epicId,
          ...(body.summary !== undefined ? { summary: body.summary } : {}),
          ...(body.outcome !== undefined
            ? { outcome: body.outcome.trim() }
            : {}),
          ...(body.description !== undefined
            ? { description: sanitizeTaskHtml(body.description) }
            : {}),
          ...(body.status !== undefined && !closing ? { status: body.status } : {}),
          ...(body.priority !== undefined ? { priority: body.priority } : {}),
          ...(body.complexity !== undefined
            ? { complexity: body.complexity }
            : {}),
          ...(body.dueDate !== undefined
            ? { dueDate: parseIsoDate(body.dueDate) }
            : {}),
          ...(body.estimation !== undefined
            ? { estimation: body.estimation }
            : {}),
          ...(body.color !== undefined ? { color: body.color } : {}),
          ...(body.acceptanceCriteria !== undefined
            ? { acceptanceCriteria: body.acceptanceCriteria }
            : {}),
          ...(body.recurrence !== undefined
            ? { recurrence: body.recurrence }
            : {}),
          ...(clearsParent
            ? { parentTaskId: null }
            : body.parentTaskId !== undefined
              ? { parentTaskId: body.parentTaskId }
              : {}),
          version: sql`${tasks.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tasks.id, existing.id),
            eq(tasks.version, closing ? body.version + 1 : body.version),
          ),
        )
        .returning();
      if (!row) {
        const [current] = await tx
          .select({ version: tasks.version })
          .from(tasks)
          .where(eq(tasks.id, existing.id))
          .limit(1);
        throw new TaskLifecycleException("conflict", {
          version: current?.version,
        });
      }
      if (body.scheduleSlots) {
        await this.replaceSlots(tx, row, body.scheduleSlots);
      }
      if (spaceChanged && !existing.parentTaskId) {
        await this.moveChildrenWithRoot(tx, row);
      }
      if (body.description !== undefined) {
        await this.relations.replaceReferences(
          tx,
          workspaceId,
          "task",
          row.id,
          collectHtmlMentions(row.description),
        );
      }
      if (body.goalId !== undefined) {
        await this.writeTaskGoal(tx, workspaceId, row.id, body.goalId);
      }
      return [row];
    });
    if (!updated) throw new ForbiddenException();

    await this.relocateRoot(existing, updated);
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    const [task] = await this.withGoalIds([updated]);
    if (!task) throw new ForbiddenException();
    await this.scheduleIndex(workspaceId, task.id);
    return task;
  }

  async move(workspaceId: string, taskId: string, body: MoveTaskBody) {
    const existing = await this.requireTaskInWorkspace(workspaceId, taskId);
    if (existing.parentTaskId) {
      throw new BadRequestException("Only root tasks can be reordered");
    }

    const destinationIds = (
      await this.rootIds(workspaceId, existing.spaceId, body.status)
    ).filter((id) => id !== existing.id);
    const index =
      body.index == null
        ? destinationIds.length
        : clampIndex(body.index, destinationIds.length);
    destinationIds.splice(index, 0, existing.id);

    const sourceIds =
      existing.status === body.status
        ? null
        : (
            await this.rootIds(workspaceId, existing.spaceId, existing.status)
          ).filter((id) => id !== existing.id);

    const closing =
      (body.status === TaskStatus.DONE || body.status === TaskStatus.CANCELLED) &&
      body.status !== existing.status;
    await this.db.transaction(async (tx) => {
      if (closing) {
        if (!body.transitionId) {
          throw new BadRequestException("transitionId is required");
        }
        await this.commitLifecycle(tx, {
          workspaceId,
          task: existing,
          action: body.status === TaskStatus.DONE ? "done" : "cancelled",
          version: body.version,
          transitionId: body.transitionId,
        });
      } else if (existing.version !== body.version) {
        throw new TaskLifecycleException("conflict", {
          version: existing.version,
        });
      }
      await this.writePositions(tx, destinationIds, {
        movedId: existing.id,
        status: body.status,
      });
      if (sourceIds) {
        await this.writePositions(tx, sourceIds, {});
      }
    });

    await this.workspaceService.bumpUpdatedAt(workspaceId);
    const moved = await this.requireTaskInWorkspace(workspaceId, taskId);
    const [task] = await this.withGoalIds([moved]);
    if (!task) throw new ForbiddenException();
    return task;
  }

  async get(workspaceId: string, taskId: string) {
    const existing = await this.requireTaskInWorkspace(workspaceId, taskId);
    const [task] = await this.withGoalIds([existing]);
    if (!task) throw new ForbiddenException();
    return task;
  }

  async abortLifecycle(
    workspaceId: string,
    taskId: string,
    transitionId: string,
  ) {
    await this.requireTaskInWorkspace(workspaceId, taskId);
    await this.db
      .delete(taskLifecycleLocks)
      .where(
        and(
          eq(taskLifecycleLocks.transitionId, transitionId),
          sql`${taskLifecycleLocks.expiresAt} > clock_timestamp()`,
        ),
      );
  }

  async listReferences(workspaceId: string, taskId: string, userId: string) {
    await this.requireTaskInWorkspace(workspaceId, taskId);
    const rows = await this.db
      .select()
      .from(taskReferences)
      .where(eq(taskReferences.taskId, taskId));
    const visible = [];
    for (const row of rows) {
      if (row.kind === "conversation" && row.conversationId) {
        const [conversation] = await this.db
          .select({ userId: conversations.userId })
          .from(conversations)
          .where(eq(conversations.id, row.conversationId))
          .limit(1);
        if (!conversation || conversation.userId !== userId) continue;
      }
      visible.push({
        id: row.id,
        kind: row.kind,
        docId: row.docId,
        conversationId: row.conversationId,
        url: row.url,
        title: row.title,
      });
    }
    return visible;
  }

  async addReference(
    workspaceId: string,
    taskId: string,
    userId: string,
    body: import("@repo/api/todex").CreateTaskReferenceBody,
  ) {
    await this.requireTaskInWorkspace(workspaceId, taskId);
    const now = new Date();
    let title = "Link";
    let docId: string | null = null;
    let conversationId: string | null = null;
    let url: string | null = null;
    if (body.kind === "doc") {
      const [doc] = await this.db
        .select({ id: docs.id, title: docs.title, workspaceId: docs.workspaceId })
        .from(docs)
        .where(eq(docs.id, body.docId))
        .limit(1);
      if (!doc || doc.workspaceId !== workspaceId) throw new ForbiddenException();
      docId = doc.id;
      title = doc.title;
    } else if (body.kind === "conversation") {
      const [conversation] = await this.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, body.conversationId))
        .limit(1);
      if (
        !conversation ||
        conversation.workspaceId !== workspaceId ||
        conversation.userId !== userId
      ) {
        throw new ForbiddenException();
      }
      conversationId = conversation.id;
      title = conversation.title ?? "Conversation";
    } else {
      url = body.url;
      title = body.title ?? body.url;
    }
    const [created] = await this.db
      .insert(taskReferences)
      .values({
        id: randomUUID(),
        workspaceId,
        taskId,
        kind: body.kind,
        docId,
        conversationId,
        url,
        title,
        createdAt: now,
      })
      .returning();
    if (!created) throw new ForbiddenException();
    return {
      id: created.id,
      kind: created.kind,
      docId: created.docId,
      conversationId: created.conversationId,
      url: created.url,
      title: created.title,
    };
  }

  async removeReference(
    workspaceId: string,
    taskId: string,
    referenceId: string,
  ) {
    await this.requireTaskInWorkspace(workspaceId, taskId);
    await this.db
      .delete(taskReferences)
      .where(
        and(
          eq(taskReferences.id, referenceId),
          eq(taskReferences.taskId, taskId),
        ),
      );
  }

  async remove(workspaceId: string, taskId: string, body: DeleteTaskBody) {
    const existing = await this.requireTaskInWorkspace(workspaceId, taskId);
    const familyIds = await this.descendantIds(existing.id);
    await this.db.transaction(async (tx) => {
      if (existing.parentTaskId) {
        await assertNoLiveLifecycleLock(tx, [existing.parentTaskId]);
      }
      await this.commitLifecycle(tx, {
        workspaceId,
        task: existing,
        action: "delete",
        version: body.version,
        transitionId: body.transitionId,
      });
      await this.relations.deleteTouching(tx, workspaceId, [
        { type: RelationEntityType.TASK, ids: familyIds },
      ]);
    });
    if (!existing.parentTaskId) {
      const ids = (
        await this.rootIds(workspaceId, existing.spaceId, existing.status)
      ).filter((id) => id !== existing.id);
      await this.writePositions(this.db, ids, {});
    }
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    await this.scheduleIndex(workspaceId, existing.id, true);
  }

  async readIndexText(
    workspaceId: string,
    taskId: string,
  ): Promise<{ title: string; text: string } | null> {
    const [row] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
      .limit(1);
    if (!row) return null;
    const criteria = (row.acceptanceCriteria ?? []).map(
      (criterion) => criterion.text,
    );
    return {
      title: row.summary,
      text: [row.summary, textFromHtml(row.description), ...criteria]
        .filter((part) => part.length > 0)
        .join("\n\n"),
    };
  }

  private async scheduleIndex(
    workspaceId: string,
    taskId: string,
    removed = false,
  ): Promise<void> {
    await this.contentIndex?.enqueue({
      workspaceId,
      sourceType: "task",
      sourceId: taskId,
      removed,
    });
  }

  private async listFiltered(workspaceId: string, query: ListTasksQuery) {
    if (query.epicId) {
      const epic = await this.epicsService.requireEpic(
        workspaceId,
        query.epicId,
      );
      if (query.spaceId && epic.spaceId !== query.spaceId) {
        throw new BadRequestException("Epic does not belong to this space");
      }
    }
    if (query.spaceId) {
      await this.spacesService.requireInWorkspace(workspaceId, query.spaceId);
    }
    const rows = await this.db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          ...(query.spaceId ? [eq(tasks.spaceId, query.spaceId)] : []),
          ...(query.epicId ? [eq(tasks.epicId, query.epicId)] : []),
        ),
      )
      .orderBy(asc(tasks.position), asc(tasks.createdAt), asc(tasks.id));
    return this.withGoalIds(rows);
  }

  async listByScheduleRange(workspaceId: string, from: Date, to: Date) {
    if (this.recurrence) await this.recurrence.materializeDue(workspaceId);
    const rows = await this.db
      .select({ task: tasks })
      .from(tasks)
      .innerJoin(taskScheduleSlots, eq(taskScheduleSlots.taskId, tasks.id))
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          isNull(taskScheduleSlots.retiredAt),
          lt(taskScheduleSlots.startAt, to),
          gt(taskScheduleSlots.endAt, from),
          sql`${tasks.status} not in ('done', 'cancelled')`,
        ),
      )
      .orderBy(asc(tasks.position), asc(tasks.createdAt), asc(tasks.id));
    const unique = new Map(rows.map((row) => [row.task.id, row.task]));
    const tasksInRange = await this.withGoalIds([...unique.values()]);
    const previews = this.recurrence
      ? await this.recurrence.previews(workspaceId, from, to)
      : [];
    return { tasks: tasksInRange, previews, conflicts: [] as TaskConflict[] };
  }

  private async withGoalIds(rows: TaskRow[]) {
    if (rows.length === 0) return [];
    const links = await this.db
      .select({ taskId: docTasks.taskId, docId: docTasks.docId })
      .from(docTasks)
      .innerJoin(docs, eq(docs.id, docTasks.docId))
      .where(
        and(
          inArray(
            docTasks.taskId,
            rows.map((row) => row.id),
          ),
          eq(docs.type, DocType.GOAL),
        ),
      );
    const goalIdByTaskId = new Map<string, string>();
    for (const link of links) {
      const current = goalIdByTaskId.get(link.taskId);
      if (!current || link.docId < current) {
        goalIdByTaskId.set(link.taskId, link.docId);
      }
    }
    const actualTime = await this.actualTimeByTask(rows.map((row) => row.id));
    const slotRows =
      rows.length === 0
        ? []
        : await this.db
            .select()
            .from(taskScheduleSlots)
            .where(
              inArray(
                taskScheduleSlots.taskId,
                rows.map((row) => row.id),
              ),
            );
    const slotsByTask = new Map<string, typeof slotRows>();
    for (const slot of slotRows) {
      const current = slotsByTask.get(slot.taskId) ?? [];
      current.push(slot);
      slotsByTask.set(slot.taskId, current);
    }
    return rows.map((row) =>
      mapTask(
        row,
        goalIdByTaskId.get(row.id) ?? null,
        actualTime.get(row.id) ?? 0,
        slotsByTask.get(row.id) ?? [],
      ),
    );
  }

  private async actualTimeByTask(taskIds: string[]) {
    const totals = new Map<string, number>();
    if (taskIds.length === 0) return totals;
    const rows = await this.db
      .select({
        taskId: executionSessionTasks.taskId,
        intervals: executionSessionTasks.intervals,
      })
      .from(executionSessionTasks)
      .where(inArray(executionSessionTasks.taskId, taskIds));
    const now = new Date();
    for (const row of rows) {
      totals.set(
        row.taskId,
        (totals.get(row.taskId) ?? 0) +
          sumIntervalSeconds(row.intervals ?? [], now),
      );
    }
    return totals;
  }

  private async writeTaskGoal(
    tx: NodePgDatabase,
    workspaceId: string,
    taskId: string,
    goalId: string | null,
  ) {
    if (goalId) {
      const [goal] = await tx
        .select({
          id: docs.id,
          workspaceId: docs.workspaceId,
          type: docs.type,
        })
        .from(docs)
        .where(eq(docs.id, goalId))
        .limit(1);
      if (!goal || goal.workspaceId !== workspaceId) {
        throw new ForbiddenException();
      }
      if (goal.type !== DocType.GOAL) {
        throw new BadRequestException("Doc is not a goal");
      }
    }
    await tx.delete(docTasks).where(eq(docTasks.taskId, taskId));
    if (!goalId) return;
    await tx.insert(docTasks).values({ docId: goalId, taskId });
  }

  private async descendantIds(taskId: string) {
    const ids = [taskId];
    let frontier = [taskId];
    while (frontier.length > 0) {
      const children = await this.db
        .select({ id: tasks.id })
        .from(tasks)
        .where(inArray(tasks.parentTaskId, frontier));
      frontier = children.map((child) => child.id);
      ids.push(...frontier);
    }
    return ids;
  }

  private async requireTaskInWorkspace(workspaceId: string, taskId: string) {
    const [row] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    if (!row || row.workspaceId !== workspaceId) {
      throw new ForbiddenException();
    }
    return row;
  }

  private async assertAcyclic(
    workspaceId: string,
    taskId: string,
    newParentId: string | null,
  ) {
    const rows = await this.db
      .select({ id: tasks.id, parentTaskId: tasks.parentTaskId })
      .from(tasks)
      .where(eq(tasks.workspaceId, workspaceId));
    const parentById = new Map(rows.map((row) => [row.id, row.parentTaskId]));
    if (hasParentCycle(taskId, newParentId, parentById)) {
      throw new BadRequestException("Task parent would create a cycle");
    }
  }

  private async epicLinkFor(
    workspaceId: string,
    existing: TaskRow | null,
    destinationSpaceId: string,
    body: { epicId?: string | null },
  ) {
    const spaceChanged =
      existing != null && existing.spaceId !== destinationSpaceId;
    if (body.epicId) {
      const epic = await this.epicsService.requireEpic(
        workspaceId,
        body.epicId,
      );
      if (epic.spaceId !== destinationSpaceId) {
        throw new BadRequestException("Epic does not belong to this space");
      }
    }
    return resolveTaskEpicLink({
      spaceChanged,
      currentEpicId: existing?.epicId ?? null,
      requestedEpicId: body.epicId,
    });
  }

  private async placementFor(
    existing: TaskRow | null,
    spaceId: string,
    body: { sectionId?: string; progressStageId?: string | null },
  ) {
    const defaultSectionId = await this.spacesService.defaultSectionId(spaceId);
    const sectionOnDestination =
      body.sectionId === undefined
        ? true
        : await this.spacesService.sectionBelongsToSpace(
            spaceId,
            body.sectionId,
          );
    const stageOnDestination =
      body.progressStageId == null
        ? true
        : await this.spacesService.stageBelongsToSpace(
            spaceId,
            body.progressStageId,
          );
    try {
      return resolveTaskPlacement({
        spaceChanged: existing == null || existing.spaceId !== spaceId,
        currentSectionId: existing?.sectionId ?? defaultSectionId,
        currentProgressStageId: existing?.progressStageId ?? null,
        requestedSectionId: body.sectionId,
        requestedProgressStageId: body.progressStageId,
        defaultSectionId,
        sectionOnDestination,
        stageOnDestination,
      });
    } catch (error) {
      if (error instanceof TaskPlacementError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private async relocateRoot(before: TaskRow, after: TaskRow) {
    const wasRoot = before.parentTaskId == null;
    const isRoot = after.parentTaskId == null;
    const leftColumn =
      wasRoot &&
      (!isRoot ||
        before.spaceId !== after.spaceId ||
        before.status !== after.status);
    const enteredColumn =
      isRoot &&
      (!wasRoot ||
        before.spaceId !== after.spaceId ||
        before.status !== after.status);
    if (!leftColumn && !enteredColumn) return;

    if (leftColumn) {
      const ids = (
        await this.rootIds(before.workspaceId, before.spaceId, before.status)
      ).filter((id) => id !== after.id);
      await this.writePositions(this.db, ids, {});
    }
    if (enteredColumn) {
      const ids = (
        await this.rootIds(after.workspaceId, after.spaceId, after.status)
      ).filter((id) => id !== after.id);
      ids.push(after.id);
      await this.writePositions(this.db, ids, {});
    }
  }

  private async replaceSlots(
    tx: NodePgDatabase,
    task: TaskRow,
    slots: NonNullable<UpdateTaskBody["scheduleSlots"]>,
  ) {
    assertScheduleSlots(
      slots.map((slot) => ({ startAt: slot.startAt, endAt: slot.endAt })),
    );
    const previous = await tx
      .select()
      .from(taskScheduleSlots)
      .where(eq(taskScheduleSlots.taskId, task.id));
    const retiredAtById = new Map(
      previous
        .filter((slot) => slot.retiredAt)
        .map((slot) => [slot.id, slot.retiredAt]),
    );
    await tx
      .delete(taskScheduleSlots)
      .where(eq(taskScheduleSlots.taskId, task.id));
    if (slots.length === 0) return;
    await tx.insert(taskScheduleSlots).values(
      slots.map((slot) => {
        const id = slot.id ?? randomUUID();
        return {
          id,
          workspaceId: task.workspaceId,
          taskId: task.id,
          startAt: new Date(slot.startAt),
          endAt: new Date(slot.endAt),
          retiredAt: slot.retiredAt
            ? new Date(slot.retiredAt)
            : (retiredAtById.get(id) ?? null),
        };
      }),
    );
  }

  private async moveChildrenWithRoot(tx: NodePgDatabase, root: TaskRow) {
    const children = await tx
      .select()
      .from(tasks)
      .where(eq(tasks.parentTaskId, root.id));
    for (const child of children) {
      const placement = await this.placementFor(child, root.spaceId, {});
      const epicId = await this.epicLinkFor(
        root.workspaceId,
        child,
        root.spaceId,
        {},
      );
      await tx
        .update(tasks)
        .set({
          spaceId: root.spaceId,
          sectionId: placement.sectionId,
          epicId,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, child.id));
    }
  }

  private async assertTaskDepth(
    tx: NodePgDatabase,
    workspaceId: string,
    taskId: string | null,
    parentTaskId: string | null,
  ) {
    if (!parentTaskId) return;
    if (taskId && parentTaskId === taskId) {
      throw new BadRequestException("Tasks can only be nested one level deep");
    }
    const [parent] = await tx
      .select()
      .from(tasks)
      .where(eq(tasks.id, parentTaskId))
      .limit(1);
    if (!parent || parent.workspaceId !== workspaceId || parent.parentTaskId) {
      throw new BadRequestException("Tasks can only be nested one level deep");
    }
    if (!taskId) return;
    const children = await tx
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.parentTaskId, taskId))
      .limit(1);
    if (children.length > 0) {
      throw new BadRequestException("Tasks can only be nested one level deep");
    }
    await this.assertAcyclic(workspaceId, taskId, parentTaskId);
  }

  private async commitLifecycle(
    tx: NodePgDatabase,
    input: {
      workspaceId: string;
      task: TaskRow;
      action: "done" | "cancelled" | "delete";
      version: number;
      transitionId: string;
    },
  ) {
    await lockTaskRows(tx, [input.task.id]);
    const children = await tx
      .select()
      .from(tasks)
      .where(eq(tasks.parentTaskId, input.task.id));
    const unfinished = children.filter(
      (child) =>
        child.status !== TaskStatus.DONE &&
        child.status !== TaskStatus.CANCELLED,
    );
    const affected = [input.task.id, ...unfinished.map((child) => child.id)];
    await lockTaskRows(tx, affected);
    const [lockedParent] = await tx
      .select()
      .from(tasks)
      .where(eq(tasks.id, input.task.id))
      .limit(1);
    if (
      lockedParent &&
      input.action !== "delete" &&
      lockedParent.status === input.action &&
      unfinished.length === 0
    ) {
      return;
    }
    if (!lockedParent || lockedParent.version !== input.version) {
      throw new TaskLifecycleException("conflict", {
        version: lockedParent?.version,
      });
    }
    const locks = await tx
      .select()
      .from(taskLifecycleLocks)
      .where(inArray(taskLifecycleLocks.taskId, affected));
    const now = new Date();
    const live = locks.filter((lock) => lock.expiresAt > now);
    if (live.some((lock) => lock.transitionId !== input.transitionId)) {
      throw new TaskLifecycleException("lifecycle_in_progress");
    }
    const expiredSame = locks.filter(
      (lock) =>
        lock.transitionId === input.transitionId && lock.expiresAt <= now,
    );
    if (expiredSame.length > 0 && live.length === 0) {
      throw new TaskLifecycleException("lease_expired");
    }
    if (live.length === 0) {
      const [current] = await tx
        .select()
        .from(tasks)
        .where(eq(tasks.id, input.task.id))
        .limit(1);
      const already =
        input.action !== "delete" &&
        current?.status === input.action &&
        unfinished.length === 0;
      if (already) return;
      const expiresAt = new Date(Date.now() + LIFECYCLE_LEASE_MS);
      await tx.insert(taskLifecycleLocks).values(
        affected.map((taskId) => ({
          taskId,
          transitionId: input.transitionId,
          action: input.action,
          expiresAt,
        })),
      );
    }
    if (await executionIsActive(tx, affected)) {
      const refreshed = await refreshLease(tx, affected, input.transitionId);
      if (!refreshed) throw new TaskLifecycleException("lease_expired");
      throw new TaskLifecycleException("execution_still_active");
    }
    const held = await tx
      .select()
      .from(taskLifecycleLocks)
      .where(
        and(
          inArray(taskLifecycleLocks.taskId, affected),
          eq(taskLifecycleLocks.transitionId, input.transitionId),
          sql`${taskLifecycleLocks.expiresAt} > clock_timestamp()`,
        ),
      );
    if (held.length !== affected.length) {
      throw new TaskLifecycleException("lease_expired");
    }
    const reread = await tx
      .select()
      .from(tasks)
      .where(eq(tasks.parentTaskId, input.task.id));
    const rereadUnfinished = reread
      .filter(
        (child) =>
          child.status !== TaskStatus.DONE &&
          child.status !== TaskStatus.CANCELLED,
      )
      .map((child) => child.id)
      .sort();
    const lockedChildren = affected.filter((id) => id !== input.task.id).sort();
    if (rereadUnfinished.join() !== lockedChildren.join()) {
      throw new TaskLifecycleException("lifecycle_in_progress");
    }
    if (input.action === "delete") {
      await tx
        .delete(executionQueue)
        .where(inArray(executionQueue.taskId, [input.task.id, ...children.map((child) => child.id)]));
      await tx.delete(tasks).where(eq(tasks.id, input.task.id));
      return;
    }
    const [parent] = await tx
      .update(tasks)
      .set({
        status: input.action,
        version: sql`${tasks.version} + 1`,
        updatedAt: now,
      })
      .where(
        and(eq(tasks.id, input.task.id), eq(tasks.version, input.version)),
      )
      .returning();
    if (!parent) {
      const [current] = await tx
        .select({ version: tasks.version })
        .from(tasks)
        .where(eq(tasks.id, input.task.id))
        .limit(1);
      throw new TaskLifecycleException("conflict", { version: current?.version });
    }
    if (rereadUnfinished.length > 0) {
      await tx
        .update(tasks)
        .set({
          status: TaskStatus.CANCELLED,
          version: sql`${tasks.version} + 1`,
          updatedAt: now,
        })
        .where(inArray(tasks.id, rereadUnfinished));
    }
    await tx
      .update(taskScheduleSlots)
      .set({ retiredAt: now })
      .where(
        and(
          inArray(taskScheduleSlots.taskId, [input.task.id, ...rereadUnfinished]),
          isNull(taskScheduleSlots.retiredAt),
          gt(taskScheduleSlots.endAt, now),
        ),
      );
    await tx
      .delete(executionQueue)
      .where(
        inArray(executionQueue.taskId, [input.task.id, ...rereadUnfinished]),
      );
    await tx
      .delete(taskLifecycleLocks)
      .where(eq(taskLifecycleLocks.transitionId, input.transitionId));
  }

  private async nextRootPosition(
    tx: NodePgDatabase,
    workspaceId: string,
    spaceId: string,
    status: TaskRow["status"],
  ) {
    const [row] = await tx
      .select({ value: sql<number>`count(*)::int` })
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.spaceId, spaceId),
          eq(tasks.status, status),
          isNull(tasks.parentTaskId),
        ),
      );
    return Number(row?.value ?? 0);
  }

  private async rootIds(
    workspaceId: string,
    spaceId: string,
    status: TaskRow["status"],
  ) {
    const rows = await this.db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.spaceId, spaceId),
          eq(tasks.status, status),
          isNull(tasks.parentTaskId),
        ),
      )
      .orderBy(asc(tasks.position), asc(tasks.createdAt), asc(tasks.id));
    return rows.map((row) => row.id);
  }

  private async writePositions(
    tx: NodePgDatabase,
    ids: string[],
    options: { movedId?: string; status?: TaskRow["status"] },
  ) {
    const now = new Date();
    for (let position = 0; position < ids.length; position += 1) {
      const id = ids[position];
      if (!id) continue;
      await tx
        .update(tasks)
        .set({
          position,
          ...(options.movedId === id && options.status
            ? { status: options.status, updatedAt: now }
            : {}),
        })
        .where(eq(tasks.id, id));
    }
  }
}

function textFromHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampIndex(index: number, length: number) {
  if (index < 0) return 0;
  if (index > length) return length;
  return index;
}
