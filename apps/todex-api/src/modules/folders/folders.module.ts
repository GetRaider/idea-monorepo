import { Module } from "@nestjs/common";

import { WorkspaceModule } from "../workspace/workspace.module";
import { DocFoldersController } from "./doc-folders.controller";
import { DocFoldersService } from "./doc-folders.service";
import { SpaceFoldersController } from "./space-folders.controller";
import { SpaceFoldersService } from "./space-folders.service";

@Module({
  imports: [WorkspaceModule],
  controllers: [SpaceFoldersController, DocFoldersController],
  providers: [SpaceFoldersService, DocFoldersService],
  exports: [SpaceFoldersService, DocFoldersService],
})
export class FoldersModule {}
