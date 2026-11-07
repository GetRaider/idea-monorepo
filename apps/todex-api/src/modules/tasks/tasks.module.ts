import { Module, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { EpicsModule } from "../epics/epics.module";
import { RelationsModule } from "../relations/relations.module";
import { SpacesModule } from "../spaces/spaces.module";
import { WorkspaceModule } from "../workspace/workspace.module";
import { RecurrenceService } from "./recurrence.service";
import { SeriesController, TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

@Module({
  imports: [WorkspaceModule, SpacesModule, EpicsModule, RelationsModule],
  controllers: [TasksController, SeriesController],
  providers: [TasksService, RecurrenceService],
  exports: [TasksService, RecurrenceService],
})
export class TasksModule implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly recurrence: RecurrenceService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.recurrence.materializeDue().catch(() => undefined);
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
