import { Controller, Delete, Get, Param, Req, UseGuards } from "@nestjs/common";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { WorkspaceService } from "./workspace.service";

@Controller("workspaces")
@UseGuards(WorkspaceGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  async list(@Req() request: WorkspaceRequest) {
    return this.workspaceService.listForUser(
      request.userId,
      request.workspaceId,
    );
  }

  @Get("members")
  async members(@Req() request: WorkspaceRequest) {
    return this.workspaceService.listMemberProfiles(request.workspaceId);
  }

  @Delete("members/:userId")
  async removeMember(
    @Req() request: WorkspaceRequest,
    @Param("userId") userId: string,
  ) {
    await this.workspaceService.removeMember(request.workspaceId, userId);
    return { ok: true };
  }
}
