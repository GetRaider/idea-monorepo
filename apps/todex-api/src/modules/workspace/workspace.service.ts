import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { DRIZZLE_DB } from "../../db/tokens";
import { workspaces, workspaceMembers } from "../../db/schema";
import { mapWorkspace, mapWorkspaceMember } from "../../db/mappers";

@Injectable()
export class WorkspaceService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async listForUser(userId: string, workspaceId: string) {
    const [workspace] = await this.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    if (!workspace) throw new NotFoundException("Workspace");

    const members = await this.db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    const member = members.find((row) => row.userId === userId);
    if (!member) throw new NotFoundException("Workspace");

    return {
      workspace: mapWorkspace(workspace),
      members: members.map(mapWorkspaceMember),
    };
  }

  async bumpUpdatedAt(workspaceId: string) {
    await this.db
      .update(workspaces)
      .set({ updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId));
  }
}
