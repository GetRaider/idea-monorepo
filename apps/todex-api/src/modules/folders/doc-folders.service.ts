import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { CreateDocFolderBody, UpdateDocFolderBody } from "@repo/api/todex";

import { DRIZZLE_DB } from "../../db/tokens";
import { docFolders, spaces } from "../../db/schema";
import { mapDocFolder } from "../../db/mappers";
import { WorkspaceService } from "../workspace/workspace.service";

@Injectable()
export class DocFoldersService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async list(workspaceId: string, spaceId?: string) {
    const rows = await this.db
      .select()
      .from(docFolders)
      .where(
        spaceId
          ? and(
              eq(docFolders.workspaceId, workspaceId),
              eq(docFolders.spaceId, spaceId),
            )
          : eq(docFolders.workspaceId, workspaceId),
      );
    return rows.map(mapDocFolder);
  }

  async create(workspaceId: string, body: CreateDocFolderBody) {
    await this.requireSpace(workspaceId, body.spaceId);
    const now = new Date();
    const [created] = await this.db
      .insert(docFolders)
      .values({
        id: randomUUID(),
        workspaceId,
        spaceId: body.spaceId,
        name: body.name,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!created) throw new ForbiddenException();
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapDocFolder(created);
  }

  async update(
    workspaceId: string,
    folderId: string,
    body: UpdateDocFolderBody,
  ) {
    const existing = await this.requireInWorkspace(workspaceId, folderId);
    const [updated] = await this.db
      .update(docFolders)
      .set({ name: body.name, updatedAt: new Date() })
      .where(eq(docFolders.id, existing.id))
      .returning();
    if (!updated) throw new ForbiddenException();
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapDocFolder(updated);
  }

  async remove(workspaceId: string, folderId: string) {
    const existing = await this.requireInWorkspace(workspaceId, folderId);
    await this.db.delete(docFolders).where(eq(docFolders.id, existing.id));
    await this.workspaceService.bumpUpdatedAt(workspaceId);
  }

  async requireInWorkspace(workspaceId: string, folderId: string) {
    const [row] = await this.db
      .select()
      .from(docFolders)
      .where(eq(docFolders.id, folderId))
      .limit(1);
    if (!row || row.workspaceId !== workspaceId) throw new ForbiddenException();
    return row;
  }

  private async requireSpace(workspaceId: string, spaceId: string) {
    const [space] = await this.db
      .select({ id: spaces.id, isInbox: spaces.isInbox })
      .from(spaces)
      .where(and(eq(spaces.id, spaceId), eq(spaces.workspaceId, workspaceId)))
      .limit(1);
    if (!space) throw new ForbiddenException();
    if (space.isInbox) {
      throw new BadRequestException("Inbox cannot have a document folder");
    }
  }
}
