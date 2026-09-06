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
  CreateTaskBodySchema,
  ListTasksQuerySchema,
  UpdateTaskBodySchema,
} from "@repo/api/todex";
import type {
  CreateTaskBody,
  ListTasksQuery,
  UpdateTaskBody,
} from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { TasksService } from "./tasks.service";

@Controller("tasks")
@UseGuards(WorkspaceGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async list(
    @Req() request: WorkspaceRequest,
    @Query(zodPipe(ListTasksQuerySchema)) query: ListTasksQuery,
  ) {
    return this.tasksService.list(request.workspaceId, query.boardId);
  }

  @Post()
  async create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateTaskBodySchema)) body: CreateTaskBody,
  ) {
    return this.tasksService.create(request.workspaceId, body);
  }

  @Patch(":id")
  async update(
    @Req() request: WorkspaceRequest,
    @Param("id") taskId: string,
    @Body(zodPipe(UpdateTaskBodySchema)) body: UpdateTaskBody,
  ) {
    return this.tasksService.update(request.workspaceId, taskId, body);
  }

  @Delete(":id")
  async remove(@Req() request: WorkspaceRequest, @Param("id") taskId: string) {
    await this.tasksService.remove(request.workspaceId, taskId);
    return { ok: true };
  }
}
