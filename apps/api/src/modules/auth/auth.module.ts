import { Module } from '@nestjs/common';
import { BetterAuthProxyController } from './auth.controller';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { processEnv } from '@helpers/processEnv.helper';
import { db } from 'db/client';
import { users, sessions, accounts, verifications } from '../../../auth-schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema: {
      users,
      sessions,
      accounts,
      verifications,
    },
  }),
  trustedOrigins: [processEnv.WEB_ORIGIN ?? 'http://localhost:3001'],
  basePath: '/api/auth',
  emailAndPassword: { enabled: false },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});

@Module({
  controllers: [BetterAuthProxyController],
})
export class AuthModule {}
