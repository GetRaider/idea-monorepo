import { Route } from "@/constants/route.constant";
import { isCalendarFeatureEnabled } from "@/helpers/feature-flags";
import { inMemoryRateLimiter } from "@/lib/rate-limit";
import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATH_PREFIXES = ["/login", "/signup", "/auth", "/api/auth"];

const CALENDAR_OFF_BLOCKED_API_PREFIXES = [
  "/api/calendar",
  "/api/integrations/google-calendar",
] as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const calendarOff = responseOnCalendarDisabled(request, pathname);
  if (calendarOff) return calendarOff;

  if (pathname.startsWith("/api/")) {
    const rateLimitResponse = inMemoryRateLimiter.checkRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;
  }

  if (pathname.startsWith(`/api${Route.AUTH}`)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required." },
        { status: 401 },
      );
    }
  }

  const isPublic =
    pathname === "/" ||
    PUBLIC_PATH_PREFIXES.some((path) => pathname.startsWith(path));
  if (!isPublic) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      return NextResponse.redirect(new URL(Route.LOGIN, request.url));
    }
  }

  return NextResponse.next();
}

function responseOnCalendarDisabled(
  request: NextRequest,
  pathname: string,
): NextResponse | null {
  if (isCalendarFeatureEnabled()) return null;
  if (
    pathname === Route.CALENDAR ||
    pathname.startsWith(`${Route.CALENDAR}/`)
  ) {
    return NextResponse.redirect(new URL(Route.TASKS, request.url));
  }
  if (
    CALENDAR_OFF_BLOCKED_API_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    )
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
