import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { CreateTaskBoardBody, UpdateTaskBoardBody } from "@repo/api/todex";

import { DRIZZLE_DB } from "../../db/tokens";
import { taskBoards } from "../../db/schema";
import { mapTaskBoard } from "../../db/mappers";
import { WorkspaceService } from "../workspace/workspace.service";

@Injectable()
export class BoardsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async list(workspaceId: string, folderId?: string) {
    const rows = await this.db
      .select()
      .from(taskBoards)
      .where(
        folderId
          ? and(
              eq(taskBoards.workspaceId, workspaceId),
              eq(taskBoards.folderId, folderId),
            )
          : eq(taskBoards.workspaceId, workspaceId),
      );
    return rows.map(mapTaskBoard);
  }

  async create(workspaceId: string, body: CreateTaskBoardBody) {
    const now = new Date();
    const [created] = await this.db
      .insert(taskBoards)
      .values({
        id: randomUUID(),
        workspaceId,
        folderId: body.folderId ?? null,
        name: body.name,
        emoji: body.emoji ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!created) throw new ForbiddenException();
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapTaskBoard(created);
  }

  async update(
    workspaceId: string,
    boardId: string,
    body: UpdateTaskBoardBody,
  ) {
    const existing = await this.requireInWorkspace(workspaceId, boardId);
    const [updated] = await this.db
      .update(taskBoards)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.folderId !== undefined ? { folderId: body.folderId } : {}),
        ...(body.emoji !== undefined ? { emoji: body.emoji } : {}),
        updatedAt: new Date(),
      })
      .where(eq(taskBoards.id, existing.id))
      .returning();
    if (!updated) throw new ForbiddenException();
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapTaskBoard(updated);
  }

  async remove(workspaceId: string, boardId: string) {
    const existing = await this.requireInWorkspace(workspaceId, boardId);
    await this.db.delete(taskBoards).where(eq(taskBoards.id, existing.id));
    await this.workspaceService.bumpUpdatedAt(workspaceId);
  }

  async requireInWorkspace(workspaceId: string, boardId: string) {
    const [row] = await this.db
      .select()
      .from(taskBoards)
      .where(eq(taskBoards.id, boardId))
      .limit(1);
    if (!row || row.workspaceId !== workspaceId) {
      throw new ForbiddenException();
    }
    return row;
  }
}
