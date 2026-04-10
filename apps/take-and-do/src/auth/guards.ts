import { headers } from "next/headers";

import { ForbiddenError, UnauthorizedError } from "@/lib/api/errors";
import {
  isAnonymousUser,
  type DataAccess,
} from "@/server/services/api/base.api.service";
import { auth } from "./server";

export function getAccessByAuth(authContext: AuthenticatedContext): DataAccess {
  return {
    userId: authContext.user.id,
    isAnonymous: authContext.isAnonymous,
  };
}

export async function requireAuth(): Promise<AuthenticatedContext> {
  const sessionResult = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionResult) {
    throw new UnauthorizedError("Authentication is required.");
  }

  const anonymous = await isAnonymousUser(sessionResult.user.id);

  return {
    session: sessionResult.session,
    user: sessionResult.user,
    isAnonymous: anonymous,
  };
}

export async function requirePermission(
  check: (ctx: AuthenticatedContext) => boolean,
  message = "You do not have permission to perform this action.",
): Promise<AuthenticatedContext> {
  const authContext = await requireAuth();
  if (!check(authContext)) throw new ForbiddenError(message);
  return authContext;
}

export async function requireNonAnonymous(): Promise<AuthenticatedContext> {
  return requirePermission(
    (ctx) => !ctx.isAnonymous,
    "Guest users cannot perform this action. Please sign in to continue.",
  );
}

export async function requireAiAccess(): Promise<AuthenticatedContext> {
  return requirePermission(
    (ctx) => !ctx.isAnonymous,
    "AI features are not available for guest users. Please sign in to use them.",
  );
}

type SessionResult = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export interface AuthenticatedContext {
  session: SessionResult["session"];
  user: SessionResult["user"];
  isAnonymous: boolean;
}
