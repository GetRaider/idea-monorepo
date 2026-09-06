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
  CreateTaskBoardBodySchema,
  ListTaskBoardsQuerySchema,
  UpdateTaskBoardBodySchema,
} from "@repo/api/todex";
import type {
  CreateTaskBoardBody,
  ListTaskBoardsQuery,
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
}
