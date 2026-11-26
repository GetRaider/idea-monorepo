import { NextResponse } from "next/server";

const HANDOFF_URL = "http://127.0.0.1:47321/callback";
const SESSION_COOKIE_NAME = "better-auth.session_token";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const session = readCookie(
    request.headers.get("cookie") ?? "",
    SESSION_COOKIE_NAME,
  );
  if (!state || !session) {
    return NextResponse.redirect(new URL("/sign-in", url.origin));
  }
  const handoff = new URL(HANDOFF_URL);
  handoff.searchParams.set("state", state);
  handoff.searchParams.set("session", session);
  return NextResponse.redirect(handoff);
}

function readCookie(header: string, name: string): string | null {
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return null;
}
