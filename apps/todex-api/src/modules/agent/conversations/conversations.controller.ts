import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../../guards/workspace.guard";
import { zodPipe } from "../../../pipes/zod-validation.pipe";
import { ConversationsService } from "./conversations.service";
import {
  PostConversationMessageSchema,
  type PostConversationMessageBody,
} from "./conversations.schema";

@Controller("agent/conversations")
@UseGuards(WorkspaceGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Post()
  @HttpCode(201)
  create(@Req() request: WorkspaceRequest) {
    return this.conversations.create(request.workspaceId, request.userId);
  }

  @Get()
  list(@Req() request: WorkspaceRequest) {
    return this.conversations.list(request.workspaceId, request.userId);
  }

  @Delete(":id")
  remove(@Req() request: WorkspaceRequest, @Param("id") conversationId: string) {
    return this.conversations.remove(request.workspaceId, conversationId);
  }

  @Get(":id")
  get(@Req() request: WorkspaceRequest, @Param("id") conversationId: string) {
    return this.conversations.get(request.workspaceId, conversationId);
  }

  @Post(":id/messages")
  async postMessage(
    @Req() request: WorkspaceRequest,
    @Param("id") conversationId: string,
    @Body(zodPipe(PostConversationMessageSchema)) body: PostConversationMessageBody,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.conversations.postMessage(
      request.workspaceId,
      request.userId,
      conversationId,
      body,
    );
    response.status(result.created ? 201 : 200);
    return {
      jobId: result.job.id,
      conversationId: result.job.conversationId,
      status: result.job.status,
    };
  }
}
