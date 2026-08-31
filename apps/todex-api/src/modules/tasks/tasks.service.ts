import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { TaskPriority, TaskStatus } from "@repo/api/todex";
import type { CreateTaskBody, UpdateTaskBody } from "@repo/api/todex";

import { DRIZZLE_DB } from "../../db/tokens";
import { tasks, workspaces } from "../../db/schema";
import { mapTask, parseIsoDate } from "../../db/mappers";
import {
  formatTaskKey,
  hasParentCycle,
} from "../../helpers/parent-cycle.helper";
import { BoardsService } from "../boards/boards.service";
import { WorkspaceService } from "../workspace/workspace.service";

@Injectable()
export class TasksService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly boardsService: BoardsService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async list(workspaceId: string, boardId: string) {
    await this.boardsService.requireInWorkspace(workspaceId, boardId);
    const rows = await this.db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.workspaceId, workspaceId), eq(tasks.taskBoardId, boardId)),
      );
    return rows.map(mapTask);
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
      const [row] = await tx
        .insert(tasks)
        .values({
          id: randomUUID(),
          workspaceId,
          taskBoardId: body.taskBoardId,
          taskKey: formatTaskKey(workspace.taskSeq),
          summary: body.summary,
          description: body.description ?? "",
          status: body.status ?? TaskStatus.TODO,
          priority: body.priority ?? TaskPriority.MEDIUM,
          dueDate: parseIsoDate(body.dueDate),
          estimationDays: body.estimationDays ?? null,
          parentTaskId: body.parentTaskId ?? null,
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
          ? { description: body.description }
          : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.dueDate !== undefined
          ? { dueDate: parseIsoDate(body.dueDate) }
          : {}),
        ...(body.estimationDays !== undefined
          ? { estimationDays: body.estimationDays }
          : {}),
        ...(body.parentTaskId !== undefined
          ? { parentTaskId: body.parentTaskId }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, existing.id))
      .returning();
    if (!updated) throw new ForbiddenException();

    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapTask(updated);
  }

  async remove(workspaceId: string, taskId: string) {
    const existing = await this.requireTaskInWorkspace(workspaceId, taskId);
    await this.db.delete(tasks).where(eq(tasks.id, existing.id));
    await this.workspaceService.bumpUpdatedAt(workspaceId);
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
}
