import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  CreateSpaceFolderBodySchema,
  UpdateSpaceFolderBodySchema,
} from "@repo/api/todex";
import type {
  CreateSpaceFolderBody,
  UpdateSpaceFolderBody,
} from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { SpaceFoldersService } from "./space-folders.service";

@Controller("space-folders")
@UseGuards(WorkspaceGuard)
export class SpaceFoldersController {
  constructor(private readonly folders: SpaceFoldersService) {}

  @Get()
  async list(@Req() request: WorkspaceRequest) {
    return this.folders.list(request.workspaceId);
  }

  @Post()
  async create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateSpaceFolderBodySchema)) body: CreateSpaceFolderBody,
  ) {
    return this.folders.create(request.workspaceId, body);
  }

  @Patch(":id")
  async update(
    @Req() request: WorkspaceRequest,
    @Param("id") folderId: string,
    @Body(zodPipe(UpdateSpaceFolderBodySchema)) body: UpdateSpaceFolderBody,
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
