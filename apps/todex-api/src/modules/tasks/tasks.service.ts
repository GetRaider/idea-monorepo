import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { and, asc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { TaskPriority, TaskStatus } from "@repo/api/todex";
import type {
  CreateTaskBody,
  ListTasksQuery,
  MoveTaskBody,
  UpdateTaskBody,
} from "@repo/api/todex";

import { DRIZZLE_DB } from "../../db/tokens";
import { tasks, workspaces, type TaskRow } from "../../db/schema";
import { mapTask, parseIsoDate } from "../../db/mappers";
import {
  formatTaskKey,
  hasParentCycle,
} from "../../helpers/parent-cycle.helper";
import { sanitizeTaskHtml } from "../../helpers/sanitize-task-html.helper";
import { BoardsService } from "../boards/boards.service";
import { WorkspaceService } from "../workspace/workspace.service";

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

    if (body.parentTaskId !== undefined) {
      await this.assertAcyclic(workspaceId, taskId, body.parentTaskId);
      if (body.parentTaskId) {
        await this.requireTaskInWorkspace(workspaceId, body.parentTaskId);
      }
    }

    const [updated] = await this.db
      .update(tasks)
      .set({
        ...(body.taskBoardId !== undefined
          ? { taskBoardId: body.taskBoardId }
          : {}),
        ...(body.summary !== undefined ? { summary: body.summary } : {}),
        ...(body.description !== undefined
          ? { description: sanitizeTaskHtml(body.description) }
          : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.dueDate !== undefined
          ? { dueDate: parseIsoDate(body.dueDate) }
          : {}),
        ...(body.scheduleDate !== undefined
          ? { scheduleDate: parseIsoDate(body.scheduleDate) }
          : {}),
        ...(body.estimation !== undefined
          ? { estimation: body.estimation }
          : {}),
        ...(body.acceptanceCriteria !== undefined
          ? { acceptanceCriteria: body.acceptanceCriteria }
          : {}),
        ...(body.parentTaskId !== undefined
          ? { parentTaskId: body.parentTaskId }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, existing.id))
      .returning();
    if (!updated) throw new ForbiddenException();

    await this.relocateRoot(existing, updated);
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapTask(updated);
  }

  async move(workspaceId: string, taskId: string, body: MoveTaskBody) {
    const existing = await this.requireTaskInWorkspace(workspaceId, taskId);
    if (existing.parentTaskId) {
      throw new BadRequestException("Only root tasks can be reordered");
    }

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
    });

    await this.workspaceService.bumpUpdatedAt(workspaceId);
    const moved = await this.requireTaskInWorkspace(workspaceId, taskId);
    return mapTask(moved);
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
    return rows.map(mapTask);
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
    return rows.map(mapTask);
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

function clampIndex(index: number, length: number) {
  if (index < 0) return 0;
  if (index > length) return length;
  return index;
}
