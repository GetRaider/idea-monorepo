import { APP_FILTER } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { Logger, Module } from "@nestjs/common";
import { AuthModule } from "@thallesp/nestjs-better-auth";

import { HttpExceptionFilter } from "@repo/api/helpers/httpExceptionFilter.helper";

import { auth } from "../auth";
import { DatabaseModule } from "../db/database.module";
import { RedisModule } from "../db/redis.module";
import { AgentModule } from "./agent/agent.module";
import { McpModule } from "./mcp/mcp.module";
import { ContentIndexModule } from "./content-index/content-index.module";
import { SpacesModule } from "./spaces/spaces.module";
import { CalendarModule } from "./calendar/calendar.module";
import { DocsModule } from "./docs/docs.module";
import { ExecutionModule } from "./execution/execution.module";
import { FoldersModule } from "./folders/folders.module";
import { HealthController } from "./health/health.controller";
import { EpicsModule } from "./epics/epics.module";
import { TasksModule } from "./tasks/tasks.module";
import { WorkspaceModule } from "./workspace/workspace.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    ContentIndexModule,
    AuthModule.forRoot({
      auth,
      disableTrustedOriginsCors: true,
    }),
    WorkspaceModule,
    FoldersModule,
    DocsModule,
    ExecutionModule,
    CalendarModule,
    SpacesModule,
    EpicsModule,
    TasksModule,
    AgentModule,
    McpModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useFactory: () => new HttpExceptionFilter(),
    },
    Logger,
  ],
})
export class AppModule {}
