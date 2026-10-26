import { Module } from "@nestjs/common";

import { EpicsModule } from "../epics/epics.module";
import { SpacesModule } from "../spaces/spaces.module";
import { WorkspaceModule } from "../workspace/workspace.module";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

@Module({
  imports: [WorkspaceModule, SpacesModule, EpicsModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
