import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Logger, Module } from '@nestjs/common';

import { UserModule } from '@modules/user/user.module';
import { RoleModule } from '@modules/role/role.module';
import { AuthModule } from '@modules/auth/auth.module';
import { CardDeckModule } from '@modules/card-deck/card-deck.module';
import { LinksModule } from '@modules/links/links.module';

import { configHelper } from '@helpers/config.helper';
import { HttpExceptionFilter } from '@denzel/api/src/helpers/httpExceptionFilter.helper';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: `.${process.env.NODE_ENV}.env` }),
    configHelper.getMongooseModule(),
    AuthModule,
    UserModule,
    RoleModule,
    CardDeckModule,
    LinksModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }, Logger],
})
export class AppModule {}
