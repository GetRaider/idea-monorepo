import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { z } from "zod";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../../guards/workspace.guard";
import { zodPipe } from "../../../pipes/zod-validation.pipe";
import { ConversationsService } from "../conversations/conversations.service";
import { JobEventBus } from "../llm/job-event-bus";

const ConfirmationSchema = z.object({
  decision: z.enum(["approve", "reject", "allow"]),
});

@Controller("agent/jobs")
@UseGuards(WorkspaceGuard)
export class JobsController {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly events: JobEventBus,
  ) {}

  @Get(":id")
  get(@Req() request: WorkspaceRequest, @Param("id") jobId: string) {
    return this.conversations.getJob(request.workspaceId, jobId);
  }

  @Get(":id/events")
  async stream(
    @Req() request: WorkspaceRequest,
    @Param("id") jobId: string,
    @Query("after") afterQuery: string | undefined,
    @Res() response: Response,
  ) {
    const job = await this.conversations.getJob(request.workspaceId, jobId);
    response.status(200);
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no");
    response.flushHeaders();
    const after = Number.isInteger(Number(afterQuery)) ? Number(afterQuery) : 0;
    writeEvent(response, "status", { status: job.status, seq: after });
    const unsubscribe = await this.events.attach(jobId, after, (sequenced) => {
      if (sequenced.event.type === "delta") {
        writeEvent(response, "delta", { text: sequenced.event.text, seq: sequenced.seq });
        return;
      }
      if (sequenced.event.type === "resync") {
        writeEvent(response, "resync", { seq: sequenced.seq });
        return;
      }
      writeEvent(response, "status", { status: sequenced.event.status, seq: sequenced.seq });
    });
    request.on("close", () => {
      unsubscribe();
      if (!response.writableEnded) response.end();
    });
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

function writeEvent(response: Response, event: string, data: unknown): void {
  response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
