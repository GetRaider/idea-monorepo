import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
} from "@nestjs/common";
import { and, asc, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  completeRecurringTask,
  DocType,
  readTaskRecurrence,
  sumIntervalSeconds,
  TaskPriority,
  TaskStatus,
} from "@repo/api/todex";
import type {
  CreateTaskBody,
  ListTasksQuery,
  MoveTaskBody,
  TaskRecurrence,
  UpdateTaskBody,
} from "@repo/api/todex";

import { DRIZZLE_DB } from "../../db/tokens";
import {
  docs,
  docTasks,
  executionSessionTasks,
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
import { SpacesService } from "../spaces/spaces.service";
import { ContentIndexQueue } from "../content-index/content-index.queue";
import { WorkspaceService } from "../workspace/workspace.service";
import { resolveTaskPlacement, TaskPlacementError } from "./task-placement";

@Injectable()
export class TasksService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly spacesService: SpacesService,
    private readonly epicsService: EpicsService,
    private readonly workspaceService: WorkspaceService,
    @Optional() private readonly contentIndex?: ContentIndexQueue,
  ) {}

  async list(workspaceId: string, query: ListTasksQuery) {
    if (query.scheduleFrom && query.scheduleTo) {
      return this.listByScheduleRange(
        workspaceId,
        new Date(query.scheduleFrom),
        new Date(query.scheduleTo),
      );
    }
    if (query.scheduleFrom || query.scheduleTo) {
      throw new BadRequestException(
        "scheduleFrom and scheduleTo are both required",
      );
    }
    return this.listFiltered(workspaceId, query);
  }

  async create(workspaceId: string, body: CreateTaskBody) {
    await this.spacesService.requireInWorkspace(workspaceId, body.spaceId);
    if (body.parentTaskId) {
      await this.requireTaskInWorkspace(workspaceId, body.parentTaskId);
    }
    const placement = await this.placementFor(null, body.spaceId, body);
    const epicId = await this.epicLinkFor(
      workspaceId,
      null,
      body.spaceId,
      body,
    );

    const created = await this.db.transaction(async (tx) => {
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
          status,
          priority: body.priority ?? TaskPriority.MEDIUM,
          dueDate: parseIsoDate(body.dueDate),
          scheduleDate: parseIsoDate(body.scheduleDate),
          estimation: body.estimation,
          acceptanceCriteria: body.acceptanceCriteria ?? [],
          recurrence: body.recurrence ?? null,
          sectionId: placement.sectionId,
          progressStageId: placement.progressStageId,
          epicId,
          parentTaskId,
          position,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return row;
    });

    if (!created) throw new ForbiddenException();
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

    if (body.parentTaskId !== undefined) {
      await this.assertAcyclic(workspaceId, taskId, body.parentTaskId);
      if (body.parentTaskId) {
        await this.requireTaskInWorkspace(workspaceId, body.parentTaskId);
      }
    }

    const completion = resolveCompletion(existing, body);
    const [updated] = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(tasks)
        .set({
          ...(body.spaceId !== undefined ? { spaceId: body.spaceId } : {}),
          sectionId: placement.sectionId,
          progressStageId: placement.progressStageId,
          epicId,
          ...(body.summary !== undefined ? { summary: body.summary } : {}),
          ...(body.description !== undefined
            ? { description: sanitizeTaskHtml(body.description) }
            : {}),
          ...(completion.status !== undefined
            ? { status: completion.status }
            : {}),
          ...(body.priority !== undefined ? { priority: body.priority } : {}),
          ...(completion.dueDate !== undefined
            ? { dueDate: completion.dueDate }
            : {}),
          ...(completion.scheduleDate !== undefined
            ? { scheduleDate: completion.scheduleDate }
            : {}),
          ...(body.estimation !== undefined
            ? { estimation: body.estimation }
            : {}),
          ...(body.color !== undefined ? { color: body.color } : {}),
          ...(completion.acceptanceCriteria !== undefined
            ? { acceptanceCriteria: completion.acceptanceCriteria }
            : {}),
          ...(completion.recurrence !== undefined
            ? { recurrence: completion.recurrence }
            : {}),
          ...(body.parentTaskId !== undefined
            ? { parentTaskId: body.parentTaskId }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, existing.id))
        .returning();
      if (row && completion.spawn) {
        await this.insertNextOccurrence(tx, row, completion.spawn);
      }
      if (row && body.goalId !== undefined) {
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

    const completion =
      body.status === TaskStatus.DONE && existing.status !== TaskStatus.DONE
        ? completeRecurringTask(recurrenceSnapshot(existing))
        : null;
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

    await this.db.transaction(async (tx) => {
      await this.writePositions(tx, destinationIds, {
        movedId: existing.id,
        status: body.status,
      });
      if (sourceIds) {
        await this.writePositions(tx, sourceIds, {});
      }
      const cancelling =
        body.status === TaskStatus.CANCELLED &&
        existing.status !== TaskStatus.CANCELLED;
      if (
        cancelling ||
        completion?.type === "finish-series" ||
        completion?.type === "advance"
      ) {
        await tx
          .update(tasks)
          .set({ recurrence: null, updatedAt: new Date() })
          .where(eq(tasks.id, existing.id));
      }
      if (completion?.type === "advance") {
        const [completed] = await tx
          .select()
          .from(tasks)
          .where(eq(tasks.id, existing.id))
          .limit(1);
        if (completed) {
          await this.insertNextOccurrence(tx, completed, completion);
        }
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

  async remove(workspaceId: string, taskId: string) {
    const existing = await this.requireTaskInWorkspace(workspaceId, taskId);
    await this.db.delete(tasks).where(eq(tasks.id, existing.id));
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

  private async listByScheduleRange(workspaceId: string, from: Date, to: Date) {
    const rows = await this.db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          gte(tasks.scheduleDate, from),
          lt(tasks.scheduleDate, to),
        ),
      )
      .orderBy(asc(tasks.position), asc(tasks.createdAt), asc(tasks.id));
    return this.withGoalIds(rows);
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
    return rows.map((row) =>
      mapTask(
        row,
        goalIdByTaskId.get(row.id) ?? null,
        actualTime.get(row.id) ?? 0,
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

  private async insertNextOccurrence(
    tx: NodePgDatabase,
    completed: TaskRow,
    next: NextOccurrence,
  ) {
    const [workspace] = await tx
      .update(workspaces)
      .set({
        taskSeq: sql`${workspaces.taskSeq} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, completed.workspaceId))
      .returning();
    if (!workspace) throw new ForbiddenException();

    const now = new Date();
    const position = completed.parentTaskId
      ? 0
      : await this.nextRootPosition(
          tx,
          completed.workspaceId,
          completed.spaceId,
          TaskStatus.TODO,
        );
    await tx.insert(tasks).values({
      id: randomUUID(),
      workspaceId: completed.workspaceId,
      spaceId: completed.spaceId,
      taskKey: formatTaskKey(workspace.taskSeq),
      summary: completed.summary,
      description: completed.description,
      status: TaskStatus.TODO,
      priority: completed.priority,
      dueDate: parseIsoDate(next.dueDate),
      scheduleDate: parseIsoDate(next.scheduleDate),
      estimation: completed.estimation,
      acceptanceCriteria: next.acceptanceCriteria ?? [],
      recurrence: next.recurrence,
      sectionId: completed.sectionId,
      progressStageId: completed.progressStageId,
      epicId: completed.epicId,
      parentTaskId: completed.parentTaskId,
      position,
      createdAt: now,
      updatedAt: now,
    });
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

function resolveCompletion(
  existing: TaskRow,
  body: UpdateTaskBody,
): CompletionUpdate {
  const scheduleDate =
    body.scheduleDate !== undefined
      ? parseIsoDate(body.scheduleDate)
      : undefined;
  const dueDate =
    body.dueDate !== undefined ? parseIsoDate(body.dueDate) : undefined;
  const recurrence = body.recurrence;
  const acceptanceCriteria = body.acceptanceCriteria;
  if (
    body.status === TaskStatus.CANCELLED &&
    existing.status !== TaskStatus.CANCELLED
  ) {
    return {
      status: TaskStatus.CANCELLED,
      scheduleDate,
      dueDate,
      recurrence: null,
      acceptanceCriteria,
      spawn: null,
    };
  }
  if (body.status !== TaskStatus.DONE || existing.status === TaskStatus.DONE) {
    return {
      status: body.status,
      scheduleDate,
      dueDate,
      recurrence,
      acceptanceCriteria,
      spawn: null,
    };
  }

  const effect = completeRecurringTask({
    status: existing.status,
    scheduleDate:
      body.scheduleDate !== undefined
        ? body.scheduleDate
        : toIso(existing.scheduleDate),
    dueDate:
      body.dueDate !== undefined ? body.dueDate : toIso(existing.dueDate),
    recurrence:
      body.recurrence !== undefined
        ? body.recurrence
        : readTaskRecurrence(existing.recurrence),
    acceptanceCriteria:
      body.acceptanceCriteria ?? existing.acceptanceCriteria ?? [],
  });
  if (effect.type === "advance") {
    return {
      status: TaskStatus.DONE,
      scheduleDate,
      dueDate,
      recurrence: null,
      acceptanceCriteria,
      spawn: effect,
    };
  }
  if (effect.type === "finish-series") {
    return {
      status: TaskStatus.DONE,
      scheduleDate,
      dueDate,
      recurrence: null,
      acceptanceCriteria,
      spawn: null,
    };
  }
  return {
    status: TaskStatus.DONE,
    scheduleDate,
    dueDate,
    recurrence,
    acceptanceCriteria,
    spawn: null,
  };
}

function recurrenceSnapshot(row: TaskRow) {
  return {
    status: row.status,
    scheduleDate: toIso(row.scheduleDate),
    dueDate: toIso(row.dueDate),
    recurrence: readTaskRecurrence(row.recurrence),
    acceptanceCriteria: row.acceptanceCriteria ?? [],
  };
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

interface NextOccurrence {
  scheduleDate: string | null;
  dueDate: string | null;
  recurrence: TaskRecurrence;
  acceptanceCriteria: NonNullable<TaskRow["acceptanceCriteria"]>;
}

interface CompletionUpdate {
  status?: TaskRow["status"];
  scheduleDate?: Date | null;
  dueDate?: Date | null;
  recurrence?: TaskRecurrence | null;
  acceptanceCriteria?: TaskRow["acceptanceCriteria"];
  spawn: NextOccurrence | null;
}
