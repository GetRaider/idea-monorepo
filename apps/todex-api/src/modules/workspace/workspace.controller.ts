import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { WorkspaceService } from "./workspace.service";

@Controller("workspaces")
@AllowAnonymous()
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
}
