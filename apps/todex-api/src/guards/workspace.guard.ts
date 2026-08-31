import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { Request } from "express";

import { db } from "../db/client";
import { ensureOwnerWorkspace } from "../db/ensure-workspace";
import { workspaceMembers } from "../db/schema";

@Injectable()
export class WorkspaceGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<WorkspaceRequest>();
    const userId = request.session?.user?.id;
    if (!userId) {
      throw new UnauthorizedException("Not authenticated");
    }

    let memberships = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));

    if (memberships.length === 0) {
      await ensureOwnerWorkspace(db, userId, request.session?.user?.name);
      memberships = await db
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.userId, userId));
    }

    if (memberships.length !== 1 || !memberships[0]) {
      throw new ForbiddenException("Expected exactly one workspace membership");
    }

    request.userId = userId;
    request.workspaceId = memberships[0].workspaceId;
    request.workspaceRole = memberships[0].role;
    return true;
  }
}

export type WorkspaceRequest = Request & {
  session?: { user?: { id?: string; name?: string | null } };
  userId: string;
  workspaceId: string;
  workspaceRole: string;
};
