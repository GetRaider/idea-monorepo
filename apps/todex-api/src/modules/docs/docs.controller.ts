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
  CreateDocBodySchema,
  ListDocsQuerySchema,
  UpdateDocBodySchema,
} from "@repo/api/todex";
import type {
  CreateDocBody,
  ListDocsQuery,
  UpdateDocBody,
} from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { DocsService } from "./docs.service";

@Controller("docs")
@UseGuards(WorkspaceGuard)
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get()
  async list(
    @Req() request: WorkspaceRequest,
    @Query(zodPipe(ListDocsQuerySchema)) query: ListDocsQuery,
  ) {
    return this.docsService.list(request.workspaceId, query);
  }

  @Post()
  async create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateDocBodySchema)) body: CreateDocBody,
  ) {
    return this.docsService.create(request.workspaceId, body);
  }

  @Get(":id")
  async get(@Req() request: WorkspaceRequest, @Param("id") docId: string) {
    return this.docsService.get(request.workspaceId, docId);
  }

  @Patch(":id")
  async update(
    @Req() request: WorkspaceRequest,
    @Param("id") docId: string,
    @Body(zodPipe(UpdateDocBodySchema)) body: UpdateDocBody,
  ) {
    return this.docsService.update(request.workspaceId, docId, body);
  }

  @Delete(":id")
  async remove(@Req() request: WorkspaceRequest, @Param("id") docId: string) {
    await this.docsService.remove(request.workspaceId, docId);
    return { ok: true };
  }
}
