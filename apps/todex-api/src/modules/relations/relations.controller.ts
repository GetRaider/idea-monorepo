import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  CreateRelationBodySchema,
  ListRelationsQuerySchema,
} from "@repo/api/todex";
import type { CreateRelationBody, ListRelationsQuery } from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { RelationsService } from "./relations.service";

@Controller("relations")
@UseGuards(WorkspaceGuard)
export class RelationsController {
  constructor(private readonly relations: RelationsService) {}

  @Get()
  async list(
    @Req() request: WorkspaceRequest,
    @Query(zodPipe(ListRelationsQuerySchema)) query: ListRelationsQuery,
  ) {
    return this.relations.list(
      request.workspaceId,
      query.entityType,
      query.entityId,
    );
  }

  @Post()
  async create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateRelationBodySchema)) body: CreateRelationBody,
  ) {
    const row = await this.relations.create(request.workspaceId, body);
    return { id: row.id, kind: row.kind };
  }

  @Delete(":id")
  async remove(
    @Req() request: WorkspaceRequest,
    @Param("id") relationId: string,
  ) {
    await this.relations.remove(request.workspaceId, relationId);
    return { ok: true };
  }
}
