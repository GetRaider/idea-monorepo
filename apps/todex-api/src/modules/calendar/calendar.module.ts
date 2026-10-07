import { Module } from "@nestjs/common";

import { WorkspaceModule } from "../workspace/workspace.module";
import { CalendarEventsService } from "./calendar-events.service";
import {
  CalendarEventsController,
  CalendarTemplatesController,
  GoogleCalendarController,
} from "./calendar.controller";
import { CalendarTemplatesService } from "./calendar-templates.service";
import { GoogleCalendarService } from "./google-calendar.service";

@Module({
  imports: [WorkspaceModule],
  controllers: [
    CalendarEventsController,
    CalendarTemplatesController,
    GoogleCalendarController,
  ],
  providers: [
    CalendarEventsService,
    CalendarTemplatesService,
    GoogleCalendarService,
  ],
})
export class CalendarModule {}
