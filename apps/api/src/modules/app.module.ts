import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';

import { UserModule } from '@modules/user/user.module';

import { configHelper } from '@helpers/config.helper';
import { HttpExceptionFilter } from '@denzel/api/src/helpers/httpExceptionFilter.helper';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // App modules
    UserModule,
    AuthModule,

    // Drizzle is initialized via db/client.ts, no Nest module required

    // TODO: Enable once we have different env files
    // ConfigModule.forRoot({ envFilePath: `.${process.env.NODE_ENV}.env` }),
  ],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }, Logger],
})
export class AppModule {}
