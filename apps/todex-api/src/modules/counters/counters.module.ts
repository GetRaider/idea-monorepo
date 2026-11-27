import { Module, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { WorkspaceModule } from "../workspace/workspace.module";
import { CountersController } from "./counters.controller";
import { CountersService } from "./counters.service";

@Module({
  imports: [WorkspaceModule],
  controllers: [CountersController],
  providers: [CountersService],
})
export class CountersModule implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly counters: CountersService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.counters.closeDue().catch(() => undefined);
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
