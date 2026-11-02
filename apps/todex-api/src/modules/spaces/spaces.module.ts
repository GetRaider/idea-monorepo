import { Module } from "@nestjs/common";

import { FoldersModule } from "../folders/folders.module";
import { RelationsModule } from "../relations/relations.module";
import { WorkspaceModule } from "../workspace/workspace.module";
import { SpacesController } from "./spaces.controller";
import { SpacesService } from "./spaces.service";

@Module({
  imports: [WorkspaceModule, FoldersModule, RelationsModule],
  controllers: [SpacesController],
  providers: [SpacesService],
  exports: [SpacesService],
})
export class SpacesModule {}
