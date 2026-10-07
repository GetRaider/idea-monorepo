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
  CreateCalendarEventBodySchema,
  CreateCalendarEventTemplateBodySchema,
  DeleteCalendarEventQuerySchema,
  ListCalendarEventsQuerySchema,
  UpdateCalendarEventBodySchema,
  UpdateCalendarEventTemplateBodySchema,
} from "@repo/api/todex";
import type {
  CreateCalendarEventBody,
  CreateCalendarEventTemplateBody,
  DeleteCalendarEventQuery,
  ListCalendarEventsQuery,
  UpdateCalendarEventBody,
  UpdateCalendarEventTemplateBody,
} from "@repo/api/todex";

import {
  WorkspaceGuard,
  type WorkspaceRequest,
} from "../../guards/workspace.guard";
import { zodPipe } from "../../pipes/zod-validation.pipe";
import { CalendarEventsService } from "./calendar-events.service";
import { CalendarTemplatesService } from "./calendar-templates.service";
import { GoogleCalendarService } from "./google-calendar.service";

@Controller("calendar/events")
@UseGuards(WorkspaceGuard)
export class CalendarEventsController {
  constructor(private readonly events: CalendarEventsService) {}

  @Get()
  list(
    @Req() request: WorkspaceRequest,
    @Query(zodPipe(ListCalendarEventsQuerySchema)) query: ListCalendarEventsQuery,
  ) {
    return this.events.list(request.workspaceId, query);
  }

  @Post()
  create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateCalendarEventBodySchema)) body: CreateCalendarEventBody,
  ) {
    return this.events.create(request.workspaceId, request.userId, body);
  }

  @Get(":id")
  get(@Req() request: WorkspaceRequest, @Param("id") eventId: string) {
    return this.events.get(request.workspaceId, eventId);
  }

  @Patch(":id")
  update(
    @Req() request: WorkspaceRequest,
    @Param("id") eventId: string,
    @Body(zodPipe(UpdateCalendarEventBodySchema)) body: UpdateCalendarEventBody,
  ) {
    return this.events.update(
      request.workspaceId,
      request.userId,
      eventId,
      body,
    );
  }

  @Delete(":id")
  async remove(
    @Req() request: WorkspaceRequest,
    @Param("id") eventId: string,
    @Query(zodPipe(DeleteCalendarEventQuerySchema))
    query: DeleteCalendarEventQuery,
  ) {
    await this.events.remove(
      request.workspaceId,
      request.userId,
      eventId,
      query,
    );
    return { ok: true };
  }
}

@Controller("calendar/templates")
@UseGuards(WorkspaceGuard)
export class CalendarTemplatesController {
  constructor(private readonly templates: CalendarTemplatesService) {}

  @Get()
  list(@Req() request: WorkspaceRequest) {
    return this.templates.list(request.workspaceId);
  }

  @Post()
  create(
    @Req() request: WorkspaceRequest,
    @Body(zodPipe(CreateCalendarEventTemplateBodySchema))
    body: CreateCalendarEventTemplateBody,
  ) {
    return this.templates.create(request.workspaceId, body);
  }

  @Patch(":id")
  update(
    @Req() request: WorkspaceRequest,
    @Param("id") templateId: string,
    @Body(zodPipe(UpdateCalendarEventTemplateBodySchema))
    body: UpdateCalendarEventTemplateBody,
  ) {
    return this.templates.update(request.workspaceId, templateId, body);
  }

  @Delete(":id")
  async remove(
    @Req() request: WorkspaceRequest,
    @Param("id") templateId: string,
  ) {
    await this.templates.remove(request.workspaceId, templateId);
    return { ok: true };
  }
}

@Controller("calendar/google")
@UseGuards(WorkspaceGuard)
export class GoogleCalendarController {
  constructor(private readonly googleCalendar: GoogleCalendarService) {}

  @Get()
  status(@Req() request: WorkspaceRequest) {
    return this.googleCalendar.status(request.userId);
  }

  @Post("sync")
  sync(@Req() request: WorkspaceRequest) {
    return this.googleCalendar.sync(request.userId, request.workspaceId);
  }

  @Delete()
  disconnect(@Req() request: WorkspaceRequest) {
    return this.googleCalendar.disconnect(request.userId);
  }
}
