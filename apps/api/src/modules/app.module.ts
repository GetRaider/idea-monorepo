import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';

import { HttpExceptionFilter } from '../helpers/httpExceptionFilter.helper';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV,
    }),
    UserModule,
    AuthModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }, Logger],
})
export class AppModule {}
