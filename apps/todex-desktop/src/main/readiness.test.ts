import { describe, expect, it, vi } from "vitest";

import { waitUntilReady, withReadinessFailures } from "./readiness";

const targets = [
  { name: "api", url: "http://localhost:8091/health" },
  { name: "web", url: "http://localhost:3002/sign-in" },
] as const;

describe("stack readiness", () => {
  it("returns ready on the first probe when both endpoints respond", async () => {
    const sleep = vi.fn(async () => undefined);
    const result = await waitUntilReady({
      targets,
      probe: async () => true,
      sleep,
      now: () => 0,
    });
    expect(result).toEqual({ status: "ready" });
    expect(sleep).not.toHaveBeenCalled();
  });

  it("reports a partial outage while it keeps polling", async () => {
    let elapsed = 0;
    const progress: string[][] = [];
    const result = await waitUntilReady({
      targets,
      probe: async (url) => url.includes(":3002") || elapsed >= 1_000,
      intervalMs: 1_000,
      timeoutMs: 5_000,
      now: () => elapsed,
      sleep: async (milliseconds) => {
        elapsed += milliseconds;
      },
      onProgress: (failed) => {
        progress.push(failed.map((failure) => failure.name));
      },
    });
    expect(result).toEqual({ status: "ready" });
    expect(progress).toEqual([["api"]]);
  });

  it("keeps polling until a partial stack becomes ready", async () => {
    let elapsed = 0;
    const result = await waitUntilReady({
      targets,
      probe: async (url) => url.includes(":3002") || elapsed >= 1_000,
      intervalMs: 1_000,
      timeoutMs: 5_000,
      now: () => elapsed,
      sleep: async (milliseconds) => {
        elapsed += milliseconds;
      },
    });
    expect(result).toEqual({ status: "ready" });
    expect(elapsed).toBe(1_000);
  });

  it("reports only the endpoints that are still down at the timeout", async () => {
    let elapsed = 0;
    const result = await waitUntilReady({
      targets,
      probe: async (url) => url.includes(":3002"),
      intervalMs: 1_000,
      timeoutMs: 2_000,
      now: () => elapsed,
      sleep: async (milliseconds) => {
        elapsed += milliseconds;
      },
    });
    expect(result).toEqual({
      status: "timeout",
      failed: [{ name: "api", url: "http://localhost:8091/health" }],
    });
  });

  it("treats a probe exception as unavailable", async () => {
    const result = await waitUntilReady({
      targets: [targets[0]],
      probe: async () => {
        throw new Error("connection refused");
      },
      timeoutMs: 0,
      now: () => 0,
      sleep: async () => undefined,
    });
    expect(result).toEqual({
      status: "timeout",
      failed: [{ name: "api", url: "http://localhost:8091/health" }],
    });
  });

  it("stops when the attempt is cancelled", async () => {
    const probe = vi.fn(async () => false);
    const result = await waitUntilReady({
      targets,
      probe,
      shouldContinue: () => false,
      sleep: async () => undefined,
      now: () => 0,
    });
    expect(result).toEqual({ status: "cancelled" });
    expect(probe).not.toHaveBeenCalled();
  });

  it("encodes failed URLs onto the status page", () => {
    const url = new URL(
      withReadinessFailures("file:///tmp/stack-down.html", [
        { name: "api", url: "http://localhost:8091/health" },
      ]),
    );
    expect(url.pathname).toBe("/tmp/stack-down.html");
    expect(url.searchParams.get("failed")).toBe("api");
    expect(url.searchParams.get("pending")).toBeNull();
    expect(url.searchParams.get("api")).toBe("http://localhost:8091/health");
    const pending = new URL(
      withReadinessFailures(
        "file:///tmp/stack-down.html",
        [{ name: "api", url: "http://localhost:8091/health" }],
        { pending: true },
      ),
    );
    expect(pending.searchParams.get("pending")).toBe("1");
    expect(withReadinessFailures("file:///tmp/stack-down.html", [])).toBe(
      "file:///tmp/stack-down.html",
    );
  });
});
