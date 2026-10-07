import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { and, asc, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  completeRecurringTask,
  DocType,
  readTaskRecurrence,
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
import { docs, docTasks, tasks, workspaces, type TaskRow } from "../../db/schema";
import { mapTask, parseIsoDate, toIso } from "../../db/mappers";
import {
  formatTaskKey,
  hasParentCycle,
} from "../../helpers/parent-cycle.helper";
import { sanitizeTaskHtml } from "../../helpers/sanitize-task-html.helper";
import { BoardsService } from "../boards/boards.service";
import { WorkspaceService } from "../workspace/workspace.service";
import { resolveTaskPlacement, TaskPlacementError } from "./task-placement";

@Injectable()
export class TasksService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly boardsService: BoardsService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async list(workspaceId: string, query: ListTasksQuery) {
    if (query.boardId) {
      return this.listByBoard(workspaceId, query.boardId);
    }
    if (!query.scheduleFrom || !query.scheduleTo) {
      throw new BadRequestException(
        "Provide boardId or both scheduleFrom and scheduleTo",
      );
    }
    return this.listByScheduleRange(
      workspaceId,
      new Date(query.scheduleFrom),
      new Date(query.scheduleTo),
    );
  }

  async create(workspaceId: string, body: CreateTaskBody) {
    await this.boardsService.requireInWorkspace(workspaceId, body.taskBoardId);
    if (body.parentTaskId) {
      await this.requireTaskInWorkspace(workspaceId, body.parentTaskId);
    }
    const placement = await this.placementFor(null, body.taskBoardId, body);

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
        : await this.nextRootPosition(
            tx,
            workspaceId,
            body.taskBoardId,
            status,
          );
      const [row] = await tx
        .insert(tasks)
        .values({
          id: randomUUID(),
          workspaceId,
          taskBoardId: body.taskBoardId,
          taskKey: formatTaskKey(workspace.taskSeq),
          summary: body.summary,
          description: sanitizeTaskHtml(body.description ?? ""),
          status,
          priority: body.priority ?? TaskPriority.MEDIUM,
          dueDate: parseIsoDate(body.dueDate),
          scheduleDate: parseIsoDate(body.scheduleDate),
          estimation: body.estimation ?? null,
          acceptanceCriteria: body.acceptanceCriteria ?? [],
          recurrence: body.recurrence ?? null,
          areaId: placement.areaId,
          progressStageId: placement.progressStageId,
          parentTaskId,
          position,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return row;
    });

    if (!created) throw new ForbiddenException();
    return mapTask(created);
  }

  async update(workspaceId: string, taskId: string, body: UpdateTaskBody) {
    const existing = await this.requireTaskInWorkspace(workspaceId, taskId);

    if (body.taskBoardId) {
      await this.boardsService.requireInWorkspace(
        workspaceId,
        body.taskBoardId,
      );
    }
    const destinationBoardId = body.taskBoardId ?? existing.taskBoardId;
    const placement = await this.placementFor(
      existing,
      destinationBoardId,
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
          ...(body.taskBoardId !== undefined
            ? { taskBoardId: body.taskBoardId }
            : {}),
          areaId: placement.areaId,
          progressStageId: placement.progressStageId,
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
      await this.rootIds(workspaceId, existing.taskBoardId, body.status)
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
            await this.rootIds(
              workspaceId,
              existing.taskBoardId,
              existing.status,
            )
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

  async remove(workspaceId: string, taskId: string) {
    const existing = await this.requireTaskInWorkspace(workspaceId, taskId);
    await this.db.delete(tasks).where(eq(tasks.id, existing.id));
    if (!existing.parentTaskId) {
      const ids = (
        await this.rootIds(workspaceId, existing.taskBoardId, existing.status)
      ).filter((id) => id !== existing.id);
      await this.writePositions(this.db, ids, {});
    }
    await this.workspaceService.bumpUpdatedAt(workspaceId);
  }

  private async listByBoard(workspaceId: string, boardId: string) {
    await this.boardsService.requireInWorkspace(workspaceId, boardId);
    const rows = await this.db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.workspaceId, workspaceId), eq(tasks.taskBoardId, boardId)),
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
    return rows.map((row) => mapTask(row, goalIdByTaskId.get(row.id) ?? null));
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

  private async placementFor(
    existing: TaskRow | null,
    boardId: string,
    body: { areaId?: string; progressStageId?: string | null },
  ) {
    const defaultAreaId = await this.boardsService.defaultAreaId(boardId);
    const areaOnDestination =
      body.areaId === undefined
        ? true
        : await this.boardsService.areaBelongsToBoard(boardId, body.areaId);
    const stageOnDestination =
      body.progressStageId == null
        ? true
        : await this.boardsService.stageBelongsToBoard(
            boardId,
            body.progressStageId,
          );
    try {
      return resolveTaskPlacement({
        boardChanged: existing == null || existing.taskBoardId !== boardId,
        currentAreaId: existing?.areaId ?? defaultAreaId,
        currentProgressStageId: existing?.progressStageId ?? null,
        requestedAreaId: body.areaId,
        requestedProgressStageId: body.progressStageId,
        defaultAreaId,
        areaOnDestination,
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
        before.taskBoardId !== after.taskBoardId ||
        before.status !== after.status);
    const enteredColumn =
      isRoot &&
      (!wasRoot ||
        before.taskBoardId !== after.taskBoardId ||
        before.status !== after.status);
    if (!leftColumn && !enteredColumn) return;

    if (leftColumn) {
      const ids = (
        await this.rootIds(
          before.workspaceId,
          before.taskBoardId,
          before.status,
        )
      ).filter((id) => id !== after.id);
      await this.writePositions(this.db, ids, {});
    }
    if (enteredColumn) {
      const ids = (
        await this.rootIds(after.workspaceId, after.taskBoardId, after.status)
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
          completed.taskBoardId,
          TaskStatus.TODO,
        );
    await tx.insert(tasks).values({
      id: randomUUID(),
      workspaceId: completed.workspaceId,
      taskBoardId: completed.taskBoardId,
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
      areaId: completed.areaId,
      progressStageId: completed.progressStageId,
      parentTaskId: completed.parentTaskId,
      position,
      createdAt: now,
      updatedAt: now,
    });
  }

  private async nextRootPosition(
    tx: NodePgDatabase,
    workspaceId: string,
    taskBoardId: string,
    status: TaskRow["status"],
  ) {
    const [row] = await tx
      .select({ value: sql<number>`count(*)::int` })
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.taskBoardId, taskBoardId),
          eq(tasks.status, status),
          isNull(tasks.parentTaskId),
        ),
      );
    return Number(row?.value ?? 0);
  }

  private async rootIds(
    workspaceId: string,
    taskBoardId: string,
    status: TaskRow["status"],
  ) {
    const rows = await this.db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.taskBoardId, taskBoardId),
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
