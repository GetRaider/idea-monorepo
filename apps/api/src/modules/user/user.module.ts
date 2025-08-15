import { Logger, Module } from '@nestjs/common';

import { UserController } from '@modules/user/user.controller';
import { UserService } from '@modules/user/user.service';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, Logger],
  exports: [UserService],
})
export class UserModule {}
