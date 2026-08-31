import { Module } from "@nestjs/common";

import { BoardsModule } from "../boards/boards.module";
import { WorkspaceModule } from "../workspace/workspace.module";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

@Module({
  imports: [WorkspaceModule, BoardsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
