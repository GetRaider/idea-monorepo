import { APP_FILTER } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { Logger, Module } from "@nestjs/common";
import { AuthModule } from "@thallesp/nestjs-better-auth";

import { HttpExceptionFilter } from "@repo/api/helpers/httpExceptionFilter.helper";

import { auth } from "../auth";
import { DatabaseModule } from "../db/database.module";
import { BoardsModule } from "./boards/boards.module";
import { FoldersModule } from "./folders/folders.module";
import { HealthController } from "./health/health.controller";
import { TasksModule } from "./tasks/tasks.module";
import { WorkspaceModule } from "./workspace/workspace.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule.forRoot({
      auth,
      disableTrustedOriginsCors: true,
    }),
    WorkspaceModule,
    FoldersModule,
    BoardsModule,
    TasksModule,
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
