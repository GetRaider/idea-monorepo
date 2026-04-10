import { NextRequest, NextResponse } from "next/server";

export class InMemoryRateLimiter {
  private readonly windowMs = 60_000;
  private readonly maxRequestsPerWindow = 60;
  private readonly globalPruneIntervalMs = 60_000;
  private readonly buckets = new Map<string, number[]>();
  private lastGlobalPruneAt = 0;

  checkRateLimit(request: NextRequest): NextResponse | null {
    const now = Date.now();
    const ip = this.clientIp(request);

    this.pruneStaleBuckets(now);

    let stamps = this.buckets.get(ip);
    if (!stamps) {
      stamps = [];
      this.buckets.set(ip, stamps);
    }

    const windowStart = now - this.windowMs;
    stamps = stamps.filter((timestamp) => timestamp > windowStart);

    if (stamps.length >= this.maxRequestsPerWindow) {
      const oldest = stamps[0]!;
      const retryAfterMs = oldest + this.windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: "Rate limit exceeded. Try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Limit": String(this.maxRequestsPerWindow),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(oldest + this.windowMs),
          },
        },
      );
    }

    stamps.push(now);
    this.buckets.set(ip, stamps);

    return null;
  }

  resetStateForTests(): void {
    this.buckets.clear();
    this.lastGlobalPruneAt = 0;
  }

  private pruneStaleBuckets(now: number) {
    if (now - this.lastGlobalPruneAt < this.globalPruneIntervalMs) return;
    this.lastGlobalPruneAt = now;

    const cutoff = now - this.windowMs;
    for (const [key, stamps] of this.buckets) {
      const kept = stamps.filter((timestamp) => timestamp > cutoff);
      if (kept.length === 0) this.buckets.delete(key);
      else this.buckets.set(key, kept);
    }
  }

  private clientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      const first = forwardedFor.split(",")[0]?.trim();
      if (first) return first;
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp?.trim()) return realIp.trim();
    return "unknown";
  }
}

export const inMemoryRateLimiter = new InMemoryRateLimiter();
