import { Module } from "@nestjs/common";

import { WorkspaceModule } from "../workspace/workspace.module";
import { SpacesController } from "./spaces.controller";
import { SpacesService } from "./spaces.service";

@Module({
  imports: [WorkspaceModule],
  controllers: [SpacesController],
  providers: [SpacesService],
  exports: [SpacesService],
})
export class SpacesModule {}
