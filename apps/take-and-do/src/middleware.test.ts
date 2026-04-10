import { getSessionCookie } from "better-auth/cookies";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { middleware } from "../middleware";
import { inMemoryRateLimiter } from "@/lib/rate-limit";

vi.mock("better-auth/cookies", () => ({
  getSessionCookie: vi.fn(),
}));

const mockedGetSessionCookie = vi.mocked(getSessionCookie);

function apiRequest(
  pathname: string,
  options?: { sessionToken?: string | null; ip?: string },
): NextRequest {
  const headers: Record<string, string> = {};
  if (options?.ip) headers["x-forwarded-for"] = options.ip;
  if (options?.sessionToken) {
    headers.cookie = `better-auth.session_token=${options.sessionToken}`;
  }
  return new NextRequest(new URL(pathname, "http://localhost:3000"), {
    headers,
  });
}

beforeEach(() => {
  inMemoryRateLimiter.resetStateForTests();
  vi.clearAllMocks();
});

afterEach(() => {
  inMemoryRateLimiter.resetStateForTests();
});

describe("middleware", () => {
  it("returns 429 when API rate limit is exceeded before auth checks", () => {
    mockedGetSessionCookie.mockReturnValue(null);
    const request = apiRequest("/api/tasks", { ip: "203.0.113.50" });
    for (let index = 0; index < 60; index += 1) {
      expect(middleware(request).status).not.toBe(429);
    }
    expect(middleware(request).status).toBe(429);
  });

  it("allows /api/auth without a session (after rate limit)", () => {
    mockedGetSessionCookie.mockReturnValue(null);
    const request = apiRequest("/api/auth/sign-in/email", {
      ip: "203.0.113.51",
    });
    const response = middleware(request);
    expect(response.status).toBe(200);
  });

  it("returns 401 for protected API routes without a session", () => {
    mockedGetSessionCookie.mockReturnValue(null);
    const request = apiRequest("/api/tasks", { ip: "203.0.113.52" });
    const response = middleware(request);
    expect(response.status).toBe(401);
  });

  it("continues for protected API routes with a session", () => {
    mockedGetSessionCookie.mockReturnValue("test-session-token");
    const request = apiRequest("/api/tasks", { ip: "203.0.113.53" });
    const response = middleware(request);
    expect(response.status).toBe(200);
  });

  it("redirects to login for non-public pages without a session", () => {
    mockedGetSessionCookie.mockReturnValue(null);
    const request = apiRequest("/tasks", { ip: "203.0.113.54" });
    const response = middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login",
    );
  });

  it("allows public routes without a session", () => {
    mockedGetSessionCookie.mockReturnValue(null);
    const request = apiRequest("/login", { ip: "203.0.113.55" });
    expect(middleware(request).status).toBe(200);
  });
});
