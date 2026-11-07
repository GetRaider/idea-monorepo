import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { SeriesTemplate } from "@repo/api/todex";

import { users } from "../../db/auth-schema";
import { DRIZZLE_DB } from "../../db/tokens";
import {
  recurringSeries,
  seriesTemplateVersions,
  tasks,
  workspaces,
  workspaceMembers,
} from "../../db/schema";
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

  async removeMember(workspaceId: string, userId: string) {
    await this.db.transaction(async (tx) => {
      const members = await tx
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, workspaceId))
        .orderBy(asc(workspaceMembers.createdAt));
      const target = members.find((member) => member.userId === userId);
      if (!target) throw new NotFoundException("Workspace member");
      const owners = members.filter((member) => member.role === "owner");
      const remainingOwners = owners.filter((member) => member.userId !== userId);
      if (target.role === "owner" && remainingOwners.length === 0) {
        throw new ConflictException(
          "The workspace needs another owner before this member can be removed",
        );
      }
      const nextOwner = remainingOwners[0] ?? members.find((member) => member.userId !== userId);
      if (!nextOwner) {
        throw new ConflictException(
          "The workspace needs another owner before this member can be removed",
        );
      }
      await tx
        .update(tasks)
        .set({ ownerId: nextOwner.userId, updatedAt: new Date() })
        .where(
          and(eq(tasks.workspaceId, workspaceId), eq(tasks.ownerId, userId)),
        );
      const versions = await tx
        .select({
          id: seriesTemplateVersions.id,
          template: seriesTemplateVersions.template,
        })
        .from(seriesTemplateVersions)
        .innerJoin(
          recurringSeries,
          eq(recurringSeries.id, seriesTemplateVersions.seriesId),
        )
        .where(eq(recurringSeries.workspaceId, workspaceId));
      for (const version of versions) {
        const template = reassignOwner(version.template, userId, nextOwner.userId);
        if (template === version.template) continue;
        await tx
          .update(seriesTemplateVersions)
          .set({ template })
          .where(eq(seriesTemplateVersions.id, version.id));
      }
      await tx
        .delete(workspaceMembers)
        .where(eq(workspaceMembers.id, target.id));
    });
  }

  async bumpUpdatedAt(workspaceId: string) {
    await this.db
      .update(workspaces)
      .set({ updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId));
  }
}

function reassignOwner(
  template: SeriesTemplate,
  fromUserId: string,
  toUserId: string,
): SeriesTemplate {
  const next = {
    ...template,
    ownerId: template.ownerId === fromUserId ? toUserId : template.ownerId,
    subtasks: template.subtasks.map((subtask) =>
      reassignOwner(subtask, fromUserId, toUserId),
    ),
  };
  return JSON.stringify(next) === JSON.stringify(template) ? template : next;
}
