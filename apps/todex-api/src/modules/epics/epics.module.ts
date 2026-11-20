import { Module } from "@nestjs/common";

import { RelationsModule } from "../relations/relations.module";
import { SpacesModule } from "../spaces/spaces.module";
import { EpicsController } from "./epics.controller";
import { EpicsService } from "./epics.service";

@Module({
  imports: [SpacesModule, RelationsModule],
  controllers: [EpicsController],
  providers: [EpicsService],
  exports: [EpicsService],
})
export class EpicsModule {}
