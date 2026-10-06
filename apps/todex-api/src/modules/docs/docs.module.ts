import { Module } from "@nestjs/common";

import { WorkspaceModule } from "../workspace/workspace.module";
import { DocsController } from "./docs.controller";
import { DocsService } from "./docs.service";

@Module({
  imports: [WorkspaceModule],
  controllers: [DocsController],
  providers: [DocsService],
})
export class DocsModule {}
