import { AnalyticsAIService } from "./analytics.service";
import { ScheduleAIService } from "./schedule.service";
import { TaskAIService } from "./task.service";

export const aiServices = {
  task: new TaskAIService(),
  schedule: new ScheduleAIService(),
  analytics: new AnalyticsAIService(),
};
