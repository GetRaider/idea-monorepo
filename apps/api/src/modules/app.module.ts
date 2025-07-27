import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';

import { UserModule } from '@modules/user/user.module';

import { configHelper } from '@helpers/config.helper';
import { HttpExceptionFilter } from '@denzel/api/src/helpers/httpExceptionFilter.helper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'entities/user.entity';

@Module({
  imports: [
    // App modules
    UserModule,

    // PostgreSqlDB
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'devdb',
      entities: [UserEntity],
      synchronize: true, // ❗ Только для разработки
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([UserEntity]),

    // TODO: Enable once we have different env files
    // ConfigModule.forRoot({ envFilePath: `.${process.env.NODE_ENV}.env` }),
  ],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }, Logger],
})
export class AppModule {}
