import { Module } from "@nestjs/common";

import { WorkspaceModule } from "../workspace/workspace.module";
import { ExecutionController } from "./execution.controller";
import { ExecutionService } from "./execution.service";

@Module({
  imports: [WorkspaceModule],
  controllers: [ExecutionController],
  providers: [ExecutionService],
})
export class ExecutionModule {}
