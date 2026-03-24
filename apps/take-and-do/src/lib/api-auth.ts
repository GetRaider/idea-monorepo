import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { type DataAccess, isAnonymousUser } from "@/lib/db/data-access";
import { auth } from "@/lib/auth";

type SessionResult = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type AuthenticatedContext = {
  session: SessionResult["session"];
  user: SessionResult["user"];
  isAnonymous: boolean;
};

export function dataAccessFromAuth(
  authContext: AuthenticatedContext,
): DataAccess {
  return {
    userId: authContext.user.id,
    isAnonymous: authContext.isAnonymous,
  };
}

export async function requireAuth(): Promise<
  AuthenticatedContext | NextResponse
> {
  const sessionResult = await auth.api.getSession({
    headers: await headers(),
  });

  if (!sessionResult) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid authentication is required." },
      { status: 401 },
    );
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
): Promise<AuthenticatedContext | NextResponse> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  if (!check(authResult)) {
    return NextResponse.json({ error: "Forbidden", message }, { status: 403 });
  }

  return authResult;
}

export async function requireNonAnonymous(): Promise<
  AuthenticatedContext | NextResponse
> {
  return requirePermission(
    (ctx) => !ctx.isAnonymous,
    "Guest users cannot perform this action. Please sign in to continue.",
  );
}

export async function requireAiAccess(): Promise<
  AuthenticatedContext | NextResponse
> {
  return requirePermission(
    (ctx) => !ctx.isAnonymous,
    "AI features are not available for guest users. Please sign in to use them.",
  );
}
