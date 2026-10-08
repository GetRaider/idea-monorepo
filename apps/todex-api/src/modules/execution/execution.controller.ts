import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  EnqueueExecutionBodySchema,
  ExecuteTaskBodySchema,
  ExecutionActivityQuerySchema,
  FocusExecutionTaskBodySchema,
  ReorderExecutionQueueBodySchema,
  UpdateExecutionSessionBodySchema,
} from "@repo/api/todex";
import type {
  EnqueueExecutionBody,
  ExecuteTaskBody,
  ExecutionActivityQuery,
  FocusExecutionTaskBody,
  ReorderExecutionQueueBody,
  UpdateExecutionSessionBody,
} from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { ExecutionService } from "./execution.service";

@Controller("execution")
@UseGuards(WorkspaceGuard)
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Get()
  async state(@Req() request: WorkspaceRequest) {
    return this.executionService.state(request.workspaceId);
  }

  @Get("sessions")
  async sessions(@Req() request: WorkspaceRequest) {
    return this.executionService.sessions(request.workspaceId);
  }

  @Get("suggestions")
  async suggestions(@Req() request: WorkspaceRequest) {
    return this.executionService.suggestions(request.workspaceId);
  }

  @Get("activity")
  async activity(
    @Req() request: WorkspaceRequest,
    @Query(zodPipe(ExecutionActivityQuerySchema)) query: ExecutionActivityQuery,
  ) {
    return this.executionService.activity(request.workspaceId, query);
  }

  @Patch("sessions/:sessionId")
  async updateSession(
    @Req() request: WorkspaceRequest,
    @Param("sessionId") sessionId: string,
    @Body(zodPipe(UpdateExecutionSessionBodySchema))
    body: UpdateExecutionSessionBody,
  ) {
    return this.executionService.updateSession(
      request.workspaceId,
      sessionId,
      body,
    );
  }

  @Delete("sessions/:sessionId")
  async deleteSession(
    @Req() request: WorkspaceRequest,
    @Param("sessionId") sessionId: string,
  ) {
    return this.executionService.deleteSession(request.workspaceId, sessionId);
  }

  @Post("execute")
  async execute(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(ExecuteTaskBodySchema)) body: ExecuteTaskBody,
  ) {
    return this.executionService.execute(request.workspaceId, body.taskIds);
  }

  @Post("preview")
  async preview(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(ExecuteTaskBodySchema)) body: ExecuteTaskBody,
  ) {
    return this.executionService.preview(request.workspaceId, body.taskIds);
  }

  @Post("focus")
  async focus(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(FocusExecutionTaskBodySchema)) body: FocusExecutionTaskBody,
  ) {
    return this.executionService.focus(request.workspaceId, body.taskId);
  }

  @Post("pause")
  async pause(@Req() request: WorkspaceRequest) {
    return this.executionService.pause(request.workspaceId);
  }

  @Post("resume")
  async resume(@Req() request: WorkspaceRequest) {
    return this.executionService.resume(request.workspaceId);
  }

  @Post("queue")
  async enqueue(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(EnqueueExecutionBodySchema)) body: EnqueueExecutionBody,
  ) {
    return this.executionService.enqueue(request.workspaceId, body.taskId);
  }

  @Post("queue/reorder")
  async reorder(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(ReorderExecutionQueueBodySchema))
    body: ReorderExecutionQueueBody,
  ) {
    return this.executionService.reorder(request.workspaceId, body.taskIds);
  }

  @Delete("queue/:taskId")
  async removeQueued(
    @Req() request: WorkspaceRequest,
    @Param("taskId") taskId: string,
  ) {
    return this.executionService.removeQueued(request.workspaceId, taskId);
  }

  @Post("complete")
  async complete(@Req() request: WorkspaceRequest) {
    return this.executionService.complete(request.workspaceId);
  }
}
