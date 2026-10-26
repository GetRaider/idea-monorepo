import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { users } from "../../db/auth-schema";
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

  async listMemberProfiles(workspaceId: string) {
    return this.db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(users.id, workspaceMembers.userId))
      .where(eq(workspaceMembers.workspaceId, workspaceId));
  }

  async assertMember(workspaceId: string, userId: string) {
    const [row] = await this.db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
        ),
      )
      .limit(1);
    if (!row) {
      throw new BadRequestException("Owner is not a member of this workspace");
    }
  }

  async bumpUpdatedAt(workspaceId: string) {
    await this.db
      .update(workspaces)
      .set({ updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId));
  }
}
