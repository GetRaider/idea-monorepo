import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';
import { resolve } from 'path';

import { HttpExceptionFilter } from '@denzel/api/helpers/httpExceptionFilter.helper';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from '../db/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Search both app-level and repo-root .env files
      envFilePath: [
        // App-level
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        '.env.local',
        '.env',
        // Monorepo root
        resolve(process.cwd(), '../../.env.local'),
        resolve(process.cwd(), `../../.env.${process.env.NODE_ENV}.local`),
        resolve(process.cwd(), `../../.env.${process.env.NODE_ENV}`),
        resolve(process.cwd(), '../../.env'),
      ],
      expandVariables: true,
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useFactory: () => new HttpExceptionFilter(),
    },
  ],
})
export class AppModule {}
