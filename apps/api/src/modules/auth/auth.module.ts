import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '../../db/client';
import { users, sessions, accounts, verifications } from '../../../auth-schema';
import { BetterAuthProxyController } from './auth.controller';
import { BETTER_AUTH } from './auth.constants';

@Module({
  imports: [ConfigModule],
  controllers: [BetterAuthProxyController],
  providers: [
    {
      provide: BETTER_AUTH,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const baseURL = configService.get<string>('AUTH_URL');
        const webOrigin = configService.get<string>('WEB_ORIGIN');
        const githubClientId = configService.get<string>('GITHUB_CLIENT_ID');
        const githubClientSecret = configService.get<string>(
          'GITHUB_CLIENT_SECRET',
        );

        return betterAuth({
          database: drizzleAdapter(db, {
            provider: 'pg',
            usePlural: true,
            schema: { users, sessions, accounts, verifications },
          }),
          baseURL,
          trustedOrigins: [webOrigin],
          basePath: '/api/auth',
          emailAndPassword: { enabled: false },
          socialProviders: {
            github: {
              clientId: githubClientId!,
              clientSecret: githubClientSecret!,
            },
          },
        });
      },
    },
  ],
  exports: [BETTER_AUTH],
})
export class AuthModule {}
