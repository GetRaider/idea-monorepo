import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '@modules/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { processEnv } from '@helpers/processEnv.helper';

const { SECRET } = processEnv;

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    forwardRef(() => UserModule),
    JwtModule.register({
      secret: SECRET || 'SECRET',
      signOptions: {
        expiresIn: '24h',
      },
    }),
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
