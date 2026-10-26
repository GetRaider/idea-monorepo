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
  CreateSpaceSectionBodySchema,
  CreateSpaceBodySchema,
  ListSpacesQuerySchema,
  ReplaceSpaceProgressStagesBodySchema,
  UpdateSpaceSectionBodySchema,
  UpdateSpaceBodySchema,
} from "@repo/api/todex";
import type {
  ApplyProgressStageTemplateBody,
  CreateSpaceSectionBody,
  CreateSpaceBody,
  ListSpacesQuery,
  ReplaceSpaceProgressStagesBody,
  UpdateSpaceSectionBody,
  UpdateSpaceBody,
} from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { SpacesService } from "./spaces.service";

@Controller("spaces")
@UseGuards(WorkspaceGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get()
  async list(
    @Req() request: WorkspaceRequest,
    @Query(zodPipe(ListSpacesQuerySchema)) query: ListSpacesQuery,
  ) {
    return this.spacesService.list(request.workspaceId, query.folderId);
  }

  @Get(":id")
  async get(@Req() request: WorkspaceRequest, @Param("id") spaceId: string) {
    return this.spacesService.get(request.workspaceId, spaceId);
  }

  @Post()
  async create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateSpaceBodySchema)) body: CreateSpaceBody,
  ) {
    return this.spacesService.create(request.workspaceId, body);
  }

  @Patch(":id")
  async update(
    @Req() request: WorkspaceRequest,
    @Param("id") spaceId: string,
    @Body(zodPipe(UpdateSpaceBodySchema)) body: UpdateSpaceBody,
  ) {
    return this.spacesService.update(request.workspaceId, spaceId, body);
  }

  @Delete(":id")
  async remove(@Req() request: WorkspaceRequest, @Param("id") spaceId: string) {
    await this.spacesService.remove(request.workspaceId, spaceId);
    return { ok: true };
  }

  @Post(":id/sections")
  async createSection(
    @Req() request: WorkspaceRequest,
    @Param("id") spaceId: string,
    @Body(zodPipe(CreateSpaceSectionBodySchema)) body: CreateSpaceSectionBody,
  ) {
    return this.spacesService.createSection(request.workspaceId, spaceId, body);
  }

  @Patch(":id/sections/:sectionId")
  async updateSection(
    @Req() request: WorkspaceRequest,
    @Param("id") spaceId: string,
    @Param("sectionId") sectionId: string,
    @Body(zodPipe(UpdateSpaceSectionBodySchema)) body: UpdateSpaceSectionBody,
  ) {
    return this.spacesService.updateSection(
      request.workspaceId,
      spaceId,
      sectionId,
      body,
    );
  }

  @Delete(":id/sections/:sectionId")
  async removeSection(
    @Req() request: WorkspaceRequest,
    @Param("id") spaceId: string,
    @Param("sectionId") sectionId: string,
  ) {
    await this.spacesService.removeSection(
      request.workspaceId,
      spaceId,
      sectionId,
    );
    return { ok: true };
  }

  @Put(":id/progress-stages")
  async replaceProgressStages(
    @Req() request: WorkspaceRequest,
    @Param("id") spaceId: string,
    @Body(zodPipe(ReplaceSpaceProgressStagesBodySchema))
    body: ReplaceSpaceProgressStagesBody,
  ) {
    return this.spacesService.replaceProgressStages(
      request.workspaceId,
      spaceId,
      body,
    );
  }

  @Post(":id/progress-stages/apply")
  async applyProgressStageTemplate(
    @Req() request: WorkspaceRequest,
    @Param("id") spaceId: string,
    @Body(zodPipe(ApplyProgressStageTemplateBodySchema))
    body: ApplyProgressStageTemplateBody,
  ) {
    return this.spacesService.applyProgressStageTemplate(
      request.workspaceId,
      spaceId,
      body,
    );
  }
}
