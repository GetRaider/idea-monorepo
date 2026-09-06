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
  CreateFolderBodySchema,
  FolderKind,
  ListFoldersQuerySchema,
  UpdateFolderBodySchema,
} from "@repo/api/todex";
import type { CreateFolderBody, UpdateFolderBody } from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { FoldersService } from "./folders.service";

@Controller("folders")
@UseGuards(WorkspaceGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  async list(
    @Req() request: WorkspaceRequest,
    @Query(zodPipe(ListFoldersQuerySchema)) query: { kind?: string },
  ) {
    return this.foldersService.list(
      request.workspaceId,
      query.kind ?? FolderKind.TASKS,
    );
  }

  @Post()
  async create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateFolderBodySchema)) body: CreateFolderBody,
  ) {
    return this.foldersService.create(request.workspaceId, body);
  }

  @Patch(":id")
  async update(
    @Req() request: WorkspaceRequest,
    @Param("id") folderId: string,
    @Body(zodPipe(UpdateFolderBodySchema)) body: UpdateFolderBody,
  ) {
    return this.foldersService.update(request.workspaceId, folderId, body);
  }

  @Delete(":id")
  async remove(
    @Req() request: WorkspaceRequest,
    @Param("id") folderId: string,
  ) {
    await this.foldersService.remove(request.workspaceId, folderId);
    return { ok: true };
  }
}
