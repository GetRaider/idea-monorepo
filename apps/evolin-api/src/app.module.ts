import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { DatabaseModule } from './database/database.module';
import { HabitsModule } from './habits/habits.module';
import { HealthController } from './health.controller';
import { ApiExceptionFilter } from './http/api-exception.filter';

@Module({
  imports: [DatabaseModule, HabitsModule],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
export class AppModule {}
