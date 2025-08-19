import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { DRIZZLE_DB } from '../../db/tokens';
import { users, sessions, accounts, verifications } from '../../../auth-schema';
import { BetterAuthProxyController } from './auth.controller';
import { BETTER_AUTH } from './auth.constants';
import { processEnv } from '@helpers/processEnv.helper';

@Module({
  imports: [ConfigModule],
  controllers: [BetterAuthProxyController],
  providers: [
    {
      provide: BETTER_AUTH,
      inject: [ConfigService, DRIZZLE_DB],
      useFactory: (configService: ConfigService, db: any) => {
        const baseURL = configService.get<string>('BETTER_AUTH_URL');
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
          baseURL: processEnv.BETTER_AUTH_URL,
          trustedOrigins: [processEnv.WEB_ORIGIN],
          basePath: '/api/auth',
          emailAndPassword: { enabled: false },
          socialProviders: {
            github: {
              clientId: processEnv.GITHUB_CLIENT_ID!,
              clientSecret: processEnv.GITHUB_CLIENT_SECRET,
            },
          },
        });
      },
    },
  ],
  exports: [BETTER_AUTH],
})
export class AuthModule {}
