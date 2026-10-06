import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApplyProgressStageTemplateBodySchema,
  CreateBoardAreaBodySchema,
  CreateTaskBoardBodySchema,
  ListTaskBoardsQuerySchema,
  ReplaceBoardProgressStagesBodySchema,
  UpdateBoardAreaBodySchema,
  UpdateTaskBoardBodySchema,
} from "@repo/api/todex";
import type {
  ApplyProgressStageTemplateBody,
  CreateBoardAreaBody,
  CreateTaskBoardBody,
  ListTaskBoardsQuery,
  ReplaceBoardProgressStagesBody,
  UpdateBoardAreaBody,
  UpdateTaskBoardBody,
} from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { BoardsService } from "./boards.service";

@Controller("boards")
@UseGuards(WorkspaceGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  async list(
    @Req() request: WorkspaceRequest,
    @Query(zodPipe(ListTaskBoardsQuerySchema)) query: ListTaskBoardsQuery,
  ) {
    return this.boardsService.list(request.workspaceId, query.folderId);
  }

  @Get(":id")
  async get(@Req() request: WorkspaceRequest, @Param("id") boardId: string) {
    return this.boardsService.get(request.workspaceId, boardId);
  }

  @Post()
  async create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateTaskBoardBodySchema)) body: CreateTaskBoardBody,
  ) {
    return this.boardsService.create(request.workspaceId, body);
  }

  @Patch(":id")
  async update(
    @Req() request: WorkspaceRequest,
    @Param("id") boardId: string,
    @Body(zodPipe(UpdateTaskBoardBodySchema)) body: UpdateTaskBoardBody,
  ) {
    return this.boardsService.update(request.workspaceId, boardId, body);
  }

  @Delete(":id")
  async remove(@Req() request: WorkspaceRequest, @Param("id") boardId: string) {
    await this.boardsService.remove(request.workspaceId, boardId);
    return { ok: true };
  }

  @Post(":id/areas")
  async createArea(
    @Req() request: WorkspaceRequest,
    @Param("id") boardId: string,
    @Body(zodPipe(CreateBoardAreaBodySchema)) body: CreateBoardAreaBody,
  ) {
    return this.boardsService.createArea(request.workspaceId, boardId, body);
  }

  @Patch(":id/areas/:areaId")
  async updateArea(
    @Req() request: WorkspaceRequest,
    @Param("id") boardId: string,
    @Param("areaId") areaId: string,
    @Body(zodPipe(UpdateBoardAreaBodySchema)) body: UpdateBoardAreaBody,
  ) {
    return this.boardsService.updateArea(
      request.workspaceId,
      boardId,
      areaId,
      body,
    );
  }

  @Delete(":id/areas/:areaId")
  async removeArea(
    @Req() request: WorkspaceRequest,
    @Param("id") boardId: string,
    @Param("areaId") areaId: string,
  ) {
    await this.boardsService.removeArea(request.workspaceId, boardId, areaId);
    return { ok: true };
  }

  @Put(":id/progress-stages")
  async replaceProgressStages(
    @Req() request: WorkspaceRequest,
    @Param("id") boardId: string,
    @Body(zodPipe(ReplaceBoardProgressStagesBodySchema))
    body: ReplaceBoardProgressStagesBody,
  ) {
    return this.boardsService.replaceProgressStages(
      request.workspaceId,
      boardId,
      body,
    );
  }

  @Post(":id/progress-stages/apply")
  async applyProgressStageTemplate(
    @Req() request: WorkspaceRequest,
    @Param("id") boardId: string,
    @Body(zodPipe(ApplyProgressStageTemplateBodySchema))
    body: ApplyProgressStageTemplateBody,
  ) {
    return this.boardsService.applyProgressStageTemplate(
      request.workspaceId,
      boardId,
      body,
    );
  }
}
