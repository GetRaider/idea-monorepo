import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  CreateSpaceFolderBody,
  UpdateSpaceFolderBody,
} from "@repo/api/todex";

import { DRIZZLE_DB } from "../../db/tokens";
import { spaceFolders } from "../../db/schema";
import { mapSpaceFolder } from "../../db/mappers";
import { WorkspaceService } from "../workspace/workspace.service";
import { nextTopLevelPosition } from "../spaces/space-position";

@Injectable()
export class SpaceFoldersService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async list(workspaceId: string) {
    const rows = await this.db
      .select()
      .from(spaceFolders)
      .where(eq(spaceFolders.workspaceId, workspaceId))
      .orderBy(asc(spaceFolders.position), asc(spaceFolders.id));
    return rows.map(mapSpaceFolder);
  }

  async create(workspaceId: string, body: CreateSpaceFolderBody) {
    const now = new Date();
    const position = await nextTopLevelPosition(this.db, workspaceId);
    const [created] = await this.db
      .insert(spaceFolders)
      .values({
        id: randomUUID(),
        workspaceId,
        name: body.name,
        emoji: body.emoji ?? null,
        position,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!created) throw new ForbiddenException();
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapSpaceFolder(created);
  }

  async update(
    workspaceId: string,
    folderId: string,
    body: UpdateSpaceFolderBody,
  ) {
    const existing = await this.requireInWorkspace(workspaceId, folderId);
    const [updated] = await this.db
      .update(spaceFolders)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.emoji !== undefined ? { emoji: body.emoji } : {}),
        ...(body.position !== undefined ? { position: body.position } : {}),
        updatedAt: new Date(),
      })
      .where(eq(spaceFolders.id, existing.id))
      .returning();
    if (!updated) throw new ForbiddenException();
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapSpaceFolder(updated);
  }

  async remove(workspaceId: string, folderId: string) {
    const existing = await this.requireInWorkspace(workspaceId, folderId);
    await this.db.delete(spaceFolders).where(eq(spaceFolders.id, existing.id));
    await this.workspaceService.bumpUpdatedAt(workspaceId);
  }

  async requireInWorkspace(workspaceId: string, folderId: string) {
    const [row] = await this.db
      .select()
      .from(spaceFolders)
      .where(eq(spaceFolders.id, folderId))
      .limit(1);
    if (!row || row.workspaceId !== workspaceId) {
      throw new ForbiddenException();
    }
    return row;
  }
}
