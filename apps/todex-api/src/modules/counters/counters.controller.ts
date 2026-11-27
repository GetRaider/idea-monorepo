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
  CounterDateSchema,
  CounterDetailQuerySchema,
  CreateCounterBodySchema,
  LinkCounterTaskBodySchema,
  ListCountersQuerySchema,
  SetCounterDayBodySchema,
  UpdateCounterBodySchema,
} from "@repo/api/todex";
import type {
  CounterDetailQuery,
  CreateCounterBody,
  LinkCounterTaskBody,
  ListCountersQuery,
  SetCounterDayBody,
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
    return this.countersService.list(
      request.workspaceId,
      query.status,
      new Date(),
      query.until,
    );
  }

  @Post()
  async create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateCounterBodySchema)) body: CreateCounterBody,
  ) {
    return this.countersService.create(request.workspaceId, body);
  }

  @Get(":id")
  async get(
    @Req() request: WorkspaceRequest,
    @Param("id") counterId: string,
    @Query(zodPipe(CounterDetailQuerySchema)) query: CounterDetailQuery,
  ) {
    return this.countersService.get(
      request.workspaceId,
      counterId,
      new Date(),
      query.until,
    );
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

  @Put(":id/days/:date")
  async setDay(
    @Req() request: WorkspaceRequest,
    @Param("id") counterId: string,
    @Param("date", zodPipe(CounterDateSchema)) date: string,
    @Body(zodPipe(SetCounterDayBodySchema)) body: SetCounterDayBody,
  ) {
    return this.countersService.setDay(
      request.workspaceId,
      counterId,
      date,
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
