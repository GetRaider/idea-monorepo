import { Module } from "@nestjs/common";

import { WorkspaceModule } from "../workspace/workspace.module";
import { FoldersController } from "./folders.controller";
import { FoldersService } from "./folders.service";

@Module({
  imports: [WorkspaceModule],
  controllers: [FoldersController],
  providers: [FoldersService],
})
export class FoldersModule {}
