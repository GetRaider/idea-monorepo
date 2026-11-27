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
  CreateCounterBodySchema,
  LinkCounterTaskBodySchema,
  ListCountersQuerySchema,
  LogCounterOccurrenceBodySchema,
  UpdateCounterBodySchema,
} from "@repo/api/todex";
import type {
  CreateCounterBody,
  LinkCounterTaskBody,
  ListCountersQuery,
  LogCounterOccurrenceBody,
  UpdateCounterBody,
} from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { CountersService } from "./counters.service";

@Controller("counters")
@UseGuards(WorkspaceGuard)
export class CountersController {
  constructor(private readonly countersService: CountersService) {}

  @Get()
  async list(
    @Req() request: WorkspaceRequest,
    @Query(zodPipe(ListCountersQuerySchema)) query: ListCountersQuery,
  ) {
    return this.countersService.list(request.workspaceId, query.status);
  }

  @Post()
  async create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateCounterBodySchema)) body: CreateCounterBody,
  ) {
    return this.countersService.create(request.workspaceId, body);
  }

  @Get(":id")
  async get(@Req() request: WorkspaceRequest, @Param("id") counterId: string) {
    return this.countersService.get(request.workspaceId, counterId);
  }

  @Patch(":id")
  async update(
    @Req() request: WorkspaceRequest,
    @Param("id") counterId: string,
    @Body(zodPipe(UpdateCounterBodySchema)) body: UpdateCounterBody,
  ) {
    return this.countersService.update(request.workspaceId, counterId, body);
  }

  @Post(":id/archive")
  async archive(
    @Req() request: WorkspaceRequest,
    @Param("id") counterId: string,
  ) {
    return this.countersService.archive(request.workspaceId, counterId);
  }

  @Post(":id/restore")
  async restore(
    @Req() request: WorkspaceRequest,
    @Param("id") counterId: string,
  ) {
    return this.countersService.restore(request.workspaceId, counterId);
  }

  @Post(":id/occurrences")
  async logOccurrence(
    @Req() request: WorkspaceRequest,
    @Param("id") counterId: string,
    @Body(zodPipe(LogCounterOccurrenceBodySchema))
    body: LogCounterOccurrenceBody,
  ) {
    return this.countersService.logOccurrence(
      request.workspaceId,
      counterId,
      body,
    );
  }

  @Delete(":id/occurrences/:occurrenceId")
  async deleteOccurrence(
    @Req() request: WorkspaceRequest,
    @Param("id") counterId: string,
    @Param("occurrenceId") occurrenceId: string,
  ) {
    return this.countersService.deleteOccurrence(
      request.workspaceId,
      counterId,
      occurrenceId,
    );
  }

  @Post(":id/links")
  async addLink(
    @Req() request: WorkspaceRequest,
    @Param("id") counterId: string,
    @Body(zodPipe(LinkCounterTaskBodySchema)) body: LinkCounterTaskBody,
  ) {
    return this.countersService.addLink(
      request.workspaceId,
      counterId,
      body.taskId,
    );
  }

  @Delete(":id/links/:linkId")
  async removeLink(
    @Req() request: WorkspaceRequest,
    @Param("id") counterId: string,
    @Param("linkId") linkId: string,
  ) {
    return this.countersService.removeLink(
      request.workspaceId,
      counterId,
      linkId,
    );
  }
}
