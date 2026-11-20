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
  CreateSeriesBodySchema,
  CreateSeriesExceptionBodySchema,
  CreateTaskBodySchema,
  CreateTaskReferenceBodySchema,
  DeleteTaskBodySchema,
  ListTasksQuerySchema,
  MoveTaskBodySchema,
  StopSeriesBodySchema,
  UpdateSeriesBodySchema,
  UpdateTaskBodySchema,
} from "@repo/api/todex";
import type {
  CreateSeriesBody,
  CreateSeriesExceptionBody,
  CreateTaskBody,
  CreateTaskReferenceBody,
  DeleteTaskBody,
  ListTasksQuery,
  MoveTaskBody,
  StopSeriesBody,
  UpdateSeriesBody,
  UpdateTaskBody,
} from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { RecurrenceService } from "./recurrence.service";
import { TasksService } from "./tasks.service";

@Controller("tasks")
@UseGuards(WorkspaceGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly recurrence: RecurrenceService,
  ) {}

  @Get()
  async list(
    @Req() request: WorkspaceRequest,
    @Query(zodPipe(ListTasksQuerySchema)) query: ListTasksQuery,
  ) {
    if (query.scheduleFrom && query.scheduleTo) {
      return this.tasksService.listByScheduleRange(
        request.workspaceId,
        new Date(query.scheduleFrom),
        new Date(query.scheduleTo),
      );
    }
    return this.tasksService.list(request.workspaceId, query);
  }

  @Post()
  async create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateTaskBodySchema)) body: CreateTaskBody,
  ) {
    return this.tasksService.create(
      request.workspaceId,
      body,
      request.userId,
    );
  }

  @Post(":id/move")
  async move(
    @Req() request: WorkspaceRequest,
    @Param("id") taskId: string,
    @Body(zodPipe(MoveTaskBodySchema)) body: MoveTaskBody,
  ) {
    return this.tasksService.move(request.workspaceId, taskId, body);
  }

  @Post(":id/series")
  async createSeries(
    @Req() request: WorkspaceRequest,
    @Param("id") taskId: string,
    @Body(zodPipe(CreateSeriesBodySchema)) body: CreateSeriesBody,
  ) {
    const seriesId = await this.recurrence.createSeries(
      request.workspaceId,
      taskId,
      new Date(body.anchor),
    );
    return { seriesId };
  }

  @Patch(":id/series")
  async updateSeries(
    @Req() request: WorkspaceRequest,
    @Param("id") taskId: string,
    @Body(zodPipe(UpdateSeriesBodySchema)) body: UpdateSeriesBody,
  ) {
    await this.recurrence.updateSeries(request.workspaceId, taskId, body);
    return this.tasksService.get(request.workspaceId, taskId);
  }

  @Get(":id/references")
  async references(
    @Req() request: WorkspaceRequest,
    @Param("id") taskId: string,
  ) {
    return this.tasksService.listReferences(
      request.workspaceId,
      taskId,
      request.userId,
    );
  }

  @Post(":id/references")
  async addReference(
    @Req() request: WorkspaceRequest,
    @Param("id") taskId: string,
    @Body(zodPipe(CreateTaskReferenceBodySchema)) body: CreateTaskReferenceBody,
  ) {
    return this.tasksService.addReference(
      request.workspaceId,
      taskId,
      request.userId,
      body,
    );
  }

  @Delete(":id/references/:referenceId")
  async removeReference(
    @Req() request: WorkspaceRequest,
    @Param("id") taskId: string,
    @Param("referenceId") referenceId: string,
  ) {
    await this.tasksService.removeReference(
      request.workspaceId,
      taskId,
      referenceId,
    );
    return { ok: true };
  }

  @Post(":id/lifecycle/:transitionId/abort")
  async abort(
    @Req() request: WorkspaceRequest,
    @Param("id") taskId: string,
    @Param("transitionId") transitionId: string,
  ) {
    await this.tasksService.abortLifecycle(
      request.workspaceId,
      taskId,
      transitionId,
    );
    return { ok: true };
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
  async remove(
    @Req() request: WorkspaceRequest,
    @Param("id") taskId: string,
    @Body(zodPipe(DeleteTaskBodySchema)) body: DeleteTaskBody,
  ) {
    await this.tasksService.remove(request.workspaceId, taskId, body);
    return { ok: true };
  }
}

@Controller("series")
@UseGuards(WorkspaceGuard)
export class SeriesController {
  constructor(private readonly recurrence: RecurrenceService) {}

  @Post(":seriesId/exceptions")
  async exception(
    @Req() request: WorkspaceRequest,
    @Param("seriesId") seriesId: string,
    @Body(zodPipe(CreateSeriesExceptionBodySchema))
    body: CreateSeriesExceptionBody,
  ) {
    await this.recurrence.addException(
      request.workspaceId,
      seriesId,
      body.occurrenceKey,
      body.kind,
    );
    return { ok: true };
  }

  @Post(":seriesId/stop")
  async stop(
    @Req() request: WorkspaceRequest,
    @Param("seriesId") seriesId: string,
    @Body(zodPipe(StopSeriesBodySchema)) body: StopSeriesBody,
  ) {
    await this.recurrence.stop(
      request.workspaceId,
      seriesId,
      body.openTaskId,
    );
    return { ok: true };
  }

  @Delete(":seriesId")
  async remove(
    @Req() request: WorkspaceRequest,
    @Param("seriesId") seriesId: string,
  ) {
    return this.recurrence.deleteSeries(request.workspaceId, seriesId);
  }
}
