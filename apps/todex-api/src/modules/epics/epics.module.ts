import { Module } from "@nestjs/common";

import { SpacesModule } from "../spaces/spaces.module";
import { EpicsController } from "./epics.controller";
import { EpicsService } from "./epics.service";

@Module({
  imports: [SpacesModule],
  controllers: [EpicsController],
  providers: [EpicsService],
  exports: [EpicsService],
})
export class EpicsModule {}
