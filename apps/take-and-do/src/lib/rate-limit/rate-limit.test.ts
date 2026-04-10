import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { inMemoryRateLimiter } from "@/lib/rate-limit";

function requestForIp(
  pathname: string,
  ip: string,
  baseUrl = "http://localhost:3000",
): NextRequest {
  return new NextRequest(new URL(pathname, baseUrl), {
    headers: { "x-forwarded-for": ip },
  });
}

afterEach(() => {
  inMemoryRateLimiter.resetStateForTests();
  vi.useRealTimers();
});

describe("InMemoryIpRateLimiter", () => {
  it("allows requests under the per-IP limit", () => {
    const request = requestForIp("/api/tasks", "203.0.113.10");
    for (let index = 0; index < 60; index += 1) {
      expect(inMemoryRateLimiter.checkRateLimit(request)).toBeNull();
    }
  });

  it("returns 429 when the sliding window is full for that IP", () => {
    const request = requestForIp("/api/tasks", "203.0.113.11");
    for (let index = 0; index < 60; index += 1) {
      expect(inMemoryRateLimiter.checkRateLimit(request)).toBeNull();
    }
    const blocked = inMemoryRateLimiter.checkRateLimit(request);
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    expect(blocked!.headers.get("Retry-After")).toBeTruthy();
    expect(blocked!.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(blocked!.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("tracks IPs independently", () => {
    const requestA = requestForIp("/api/tasks", "203.0.113.20");
    const requestB = requestForIp("/api/tasks", "203.0.113.21");
    for (let index = 0; index < 60; index += 1) {
      expect(inMemoryRateLimiter.checkRateLimit(requestA)).toBeNull();
    }
    expect(inMemoryRateLimiter.checkRateLimit(requestB)).toBeNull();
  });

  it("uses x-real-ip when x-forwarded-for is absent", () => {
    const request = new NextRequest(new URL("http://localhost:3000/api/foo"), {
      headers: { "x-real-ip": "198.51.100.5" },
    });
    for (let index = 0; index < 60; index += 1) {
      expect(inMemoryRateLimiter.checkRateLimit(request)).toBeNull();
    }
    expect(inMemoryRateLimiter.checkRateLimit(request)!.status).toBe(429);
  });

  it("prunes expired entries on the global interval so buckets can empty", () => {
    vi.useFakeTimers();
    const request = requestForIp("/api/tasks", "203.0.113.30");
    expect(inMemoryRateLimiter.checkRateLimit(request)).toBeNull();

    vi.advanceTimersByTime(60_000);

    for (let index = 0; index < 60; index += 1) {
      expect(inMemoryRateLimiter.checkRateLimit(request)).toBeNull();
    }
    expect(inMemoryRateLimiter.checkRateLimit(request)!.status).toBe(429);
  });
});
