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
  CreateDocFolderBodySchema,
  ListDocFoldersQuerySchema,
  UpdateDocFolderBodySchema,
} from "@repo/api/todex";
import type {
  CreateDocFolderBody,
  ListDocFoldersQuery,
  UpdateDocFolderBody,
} from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { DocFoldersService } from "./doc-folders.service";

@Controller("doc-folders")
@UseGuards(WorkspaceGuard)
export class DocFoldersController {
  constructor(private readonly folders: DocFoldersService) {}

  @Get()
  async list(
    @Req() request: WorkspaceRequest,
    @Query(zodPipe(ListDocFoldersQuerySchema)) query: ListDocFoldersQuery,
  ) {
    return this.folders.list(request.workspaceId, query.spaceId);
  }

  @Post()
  async create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateDocFolderBodySchema)) body: CreateDocFolderBody,
  ) {
    return this.folders.create(request.workspaceId, body);
  }

  @Patch(":id")
  async update(
    @Req() request: WorkspaceRequest,
    @Param("id") folderId: string,
    @Body(zodPipe(UpdateDocFolderBodySchema)) body: UpdateDocFolderBody,
  ) {
    return this.folders.update(request.workspaceId, folderId, body);
  }

  @Delete(":id")
  async remove(
    @Req() request: WorkspaceRequest,
    @Param("id") folderId: string,
  ) {
    await this.folders.remove(request.workspaceId, folderId);
    return { ok: true };
  }
}
