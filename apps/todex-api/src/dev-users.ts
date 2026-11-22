import { Logger } from "@nestjs/common";

import { auth } from "./auth";
import { env } from "./env/env";

export const DEV_USERS = [
  { email: "dev@todex.test", name: "Dev User" },
  { email: "dev2@todex.test", name: "Dev User Two" },
] as const;

/**
 * Creates local test users with email/password credentials when TODEX_DEV_LOGIN=true.
 * Idempotent: existing users are left untouched. Each user gets its own workspace
 * through the user.create database hook.
 */
export async function seedDevUsers(): Promise<void> {
  if (!env.auth.devLogin || env.nodeEnv === "production") return;
  const ctx = await auth.$context;
  for (const devUser of DEV_USERS) {
    const existing = await ctx.internalAdapter.findUserByEmail(devUser.email);
    if (existing) continue;
    const user = await ctx.internalAdapter.createUser({
      email: devUser.email,
      name: devUser.name,
      emailVerified: true,
    });
    await ctx.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: await ctx.password.hash(env.auth.devPassword),
    });
    new Logger("DevUsers").log(`Created local test user ${devUser.email}`);
  }
}
