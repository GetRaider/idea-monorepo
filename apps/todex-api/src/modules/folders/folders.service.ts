import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { CreateFolderBody, UpdateFolderBody } from "@repo/api/todex";

import { DRIZZLE_DB } from "../../db/tokens";
import { folders } from "../../db/schema";
import { mapFolder } from "../../db/mappers";
import { WorkspaceService } from "../workspace/workspace.service";

@Injectable()
export class FoldersService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async list(workspaceId: string, kind?: string) {
    const rows = await this.db
      .select()
      .from(folders)
      .where(
        kind
          ? and(
              eq(folders.workspaceId, workspaceId),
              eq(folders.kind, kind as "tasks" | "docs"),
            )
          : eq(folders.workspaceId, workspaceId),
      );
    return rows.map(mapFolder);
  }

  async create(workspaceId: string, body: CreateFolderBody) {
    const now = new Date();
    const [created] = await this.db
      .insert(folders)
      .values({
        id: randomUUID(),
        workspaceId,
        parentId: body.parentId ?? null,
        kind: body.kind,
        name: body.name,
        emoji: body.emoji ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!created) throw new ForbiddenException();
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapFolder(created);
  }

  async update(workspaceId: string, folderId: string, body: UpdateFolderBody) {
    const existing = await this.requireInWorkspace(workspaceId, folderId);
    const [updated] = await this.db
      .update(folders)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
        ...(body.emoji !== undefined ? { emoji: body.emoji } : {}),
        updatedAt: new Date(),
      })
      .where(eq(folders.id, existing.id))
      .returning();
    if (!updated) throw new ForbiddenException();
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapFolder(updated);
  }

  async remove(workspaceId: string, folderId: string) {
    const existing = await this.requireInWorkspace(workspaceId, folderId);
    await this.db.delete(folders).where(eq(folders.id, existing.id));
    await this.workspaceService.bumpUpdatedAt(workspaceId);
  }

  private async requireInWorkspace(workspaceId: string, folderId: string) {
    const [row] = await this.db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);
    if (!row || row.workspaceId !== workspaceId) {
      throw new ForbiddenException();
    }
    return row;
  }
}
