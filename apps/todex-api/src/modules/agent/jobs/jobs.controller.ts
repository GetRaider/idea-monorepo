import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../../guards/workspace.guard";
import { ConversationsService } from "../conversations/conversations.service";

@Controller("agent/jobs")
@UseGuards(WorkspaceGuard)
export class JobsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get(":id")
  get(@Req() request: WorkspaceRequest, @Param("id") jobId: string) {
    return this.conversations.getJob(request.workspaceId, jobId);
  }
}
