import {
  Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards,
} from "@nestjs/common";
import {
  CreateKnowledgeDatabaseSchema,
  RenameKnowledgeDatabaseSchema,
  CreateKnowledgePropertySchema,
  PatchKnowledgeCellSchema,
  UpdateKnowledgePropertySchema,
  UpdateKnowledgeViewSchema,
} from "@repo/api/todex";
import type {
  CreateKnowledgeDatabase,
  RenameKnowledgeDatabase,
  CreateKnowledgeProperty,
  PatchKnowledgeCell,
  UpdateKnowledgeProperty,
  UpdateKnowledgeView,
} from "@repo/api/todex";
import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { KnowledgeDatabasesService } from "./knowledge-databases.service";

@Controller("knowledge-databases")
@UseGuards(WorkspaceGuard)
export class KnowledgeDatabasesController {
  constructor(private readonly service: KnowledgeDatabasesService) {}

  @Post()
  create(@Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateKnowledgeDatabaseSchema)) body: CreateKnowledgeDatabase) {
    return this.service.create(request.workspaceId, body);
  }

  @Get(":id")
  get(@Req() request: WorkspaceRequest, @Param("id") id: string) {
    return this.service.get(request.workspaceId, id);
  }

  @Patch(":id")
  rename(@Req() request: WorkspaceRequest, @Param("id") id: string,
    @Body(zodPipe(RenameKnowledgeDatabaseSchema)) body: RenameKnowledgeDatabase) {
    return this.service.rename(request.workspaceId, id, body);
  }

  @Post(":id/properties")
  addProperty(@Req() request: WorkspaceRequest, @Param("id") id: string,
    @Body(zodPipe(CreateKnowledgePropertySchema)) body: CreateKnowledgeProperty) {
    return this.service.addProperty(request.workspaceId, id, body);
  }

  @Patch(":id/properties/:propertyId")
  updateProperty(@Req() request: WorkspaceRequest, @Param("id") id: string,
    @Param("propertyId") propertyId: string,
    @Body(zodPipe(UpdateKnowledgePropertySchema)) body: UpdateKnowledgeProperty) {
    return this.service.updateProperty(request.workspaceId, id, propertyId, body);
  }

  @Delete(":id/properties/:propertyId")
  deleteProperty(@Req() request: WorkspaceRequest, @Param("id") id: string,
    @Param("propertyId") propertyId: string) {
    return this.service.deleteProperty(request.workspaceId, id, propertyId);
  }

  @Post(":id/rows")
  addRow(@Req() request: WorkspaceRequest, @Param("id") id: string) {
    return this.service.addRow(request.workspaceId, id);
  }

  @Patch(":id/rows/:rowId")
  patchCell(@Req() request: WorkspaceRequest, @Param("id") id: string,
    @Param("rowId") rowId: string,
    @Body(zodPipe(PatchKnowledgeCellSchema)) body: PatchKnowledgeCell) {
    return this.service.patchCell(request.workspaceId, id, rowId, body);
  }

  @Delete(":id/rows/:rowId")
  removeRow(@Req() request: WorkspaceRequest, @Param("id") id: string,
    @Param("rowId") rowId: string) {
    return this.service.removeRow(request.workspaceId, id, rowId);
  }

  @Patch(":id/view")
  updateView(@Req() request: WorkspaceRequest, @Param("id") id: string,
    @Body(zodPipe(UpdateKnowledgeViewSchema)) body: UpdateKnowledgeView) {
    return this.service.updateView(request.workspaceId, id, body);
  }
}
