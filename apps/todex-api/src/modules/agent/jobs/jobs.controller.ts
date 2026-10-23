import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from "@nestjs/common";
import { z } from "zod";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../../guards/workspace.guard";
import { zodPipe } from "../../../pipes/zod-validation.pipe";
import { ConversationsService } from "../conversations/conversations.service";

const ConfirmationSchema = z.object({
  decision: z.enum(["approve", "reject", "allow"]),
});

@Controller("agent/jobs")
@UseGuards(WorkspaceGuard)
export class JobsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get(":id")
  get(@Req() request: WorkspaceRequest, @Param("id") jobId: string) {
    return this.conversations.getJob(request.workspaceId, jobId);
  }

  @Post(":id/confirmation")
  @HttpCode(200)
  confirm(
    @Req() request: WorkspaceRequest,
    @Param("id") jobId: string,
    @Body(zodPipe(ConfirmationSchema)) body: z.infer<typeof ConfirmationSchema>,
  ) {
    return this.conversations.confirm(
      request.workspaceId,
      jobId,
      body.decision === "reject" ? "rejected" : body.decision === "allow" ? "allowed" : "approved",
    );
  }
}
