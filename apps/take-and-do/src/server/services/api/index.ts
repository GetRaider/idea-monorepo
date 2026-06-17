import { db } from "@/db/client";
import { AnalyticsApiService } from "./analytics.api.service";
import { CalendarEventsApiService } from "./calendar-events.api.service";
import { FoldersApiService } from "./folders.api.service";
import { LabelsApiService } from "./labels.api.service";
import { StatsApiService } from "./stats.api.service";
import { TaskBoardsApiService } from "./task-boards.api.service";
import { TasksApiService } from "./tasks.api.service";
import { WorkspaceApiService } from "./workspace.api.service";
import { FocusApiService } from "./focus.api.service";
import { GoogleCalendarIntegrationApiService } from "./google-calendar-integration.api.service";

const workspaceService = new WorkspaceApiService(db);
const taskBoardsService = new TaskBoardsApiService(db, workspaceService);
const labelsService = new LabelsApiService(db);
const tasksService = new TasksApiService(db, taskBoardsService, labelsService);

const calendarEventsService = new CalendarEventsApiService(db);

export const apiServices = {
  tasks: tasksService,
  calendarEvents: calendarEventsService,
  folders: new FoldersApiService(db, workspaceService),
  labels: labelsService,
  taskBoards: taskBoardsService,
  workspace: workspaceService,
  analytics: new AnalyticsApiService(db),
  stats: new StatsApiService(db, tasksService),
  focus: new FocusApiService(db),
  googleCalendarIntegration: new GoogleCalendarIntegrationApiService(db),
};
