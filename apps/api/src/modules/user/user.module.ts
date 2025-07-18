import { forwardRef, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserController } from '@modules/user/user.controller';
import { UserService } from '@modules/user/user.service';
import { AuthModule } from '@modules/auth/auth.module';
import { RoleService } from '@modules/role/role.service';
import { RoleEntity, RoleSchema } from '../../schemas/role.schema';
import { UserEntity, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserSchema },
      { name: RoleEntity.name, schema: RoleSchema },
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService, Logger, RoleService],
  exports: [UserService],
})
export class UserModule {}
