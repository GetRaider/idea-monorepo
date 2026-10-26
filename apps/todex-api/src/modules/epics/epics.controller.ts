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
import { CreateEpicBodySchema, UpdateEpicBodySchema } from "@repo/api/todex";
import type { CreateEpicBody, UpdateEpicBody } from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { EpicsService } from "./epics.service";

@Controller()
@UseGuards(WorkspaceGuard)
export class EpicsController {
  constructor(private readonly epicsService: EpicsService) {}

  @Get("spaces/:spaceId/epics")
  async list(
    @Req() request: WorkspaceRequest,
    @Param("spaceId") spaceId: string,
  ) {
    return this.epicsService.list(request.workspaceId, spaceId);
  }

  @Post("spaces/:spaceId/epics")
  async create(
    @Req() request: WorkspaceRequest,
    @Param("spaceId") spaceId: string,
    @Body(zodPipe(CreateEpicBodySchema)) body: CreateEpicBody,
  ) {
    return this.epicsService.create(request.workspaceId, spaceId, body);
  }

  @Get("epics/:id")
  async get(@Req() request: WorkspaceRequest, @Param("id") epicId: string) {
    return this.epicsService.get(request.workspaceId, epicId);
  }

  @Patch("epics/:id")
  async update(
    @Req() request: WorkspaceRequest,
    @Param("id") epicId: string,
    @Body(zodPipe(UpdateEpicBodySchema)) body: UpdateEpicBody,
  ) {
    return this.epicsService.update(request.workspaceId, epicId, body);
  }

  @Delete("epics/:id")
  async remove(@Req() request: WorkspaceRequest, @Param("id") epicId: string) {
    await this.epicsService.remove(request.workspaceId, epicId);
    return { ok: true };
  }
}
