import { setTimeout as delay } from "node:timers/promises";

export const READINESS_INTERVAL_MS = 1_000;
export const READINESS_TIMEOUT_MS = 60_000;

export async function waitUntilReady(
  options: WaitUntilReadyOptions,
): Promise<ReadinessResult> {
  const intervalMs = options.intervalMs ?? READINESS_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? READINESS_TIMEOUT_MS;
  const sleep = options.sleep ?? delay;
  const now = options.now ?? Date.now;
  const shouldContinue = options.shouldContinue ?? (() => true);
  const deadline = now() + timeoutMs;

  while (shouldContinue()) {
    const probed = await Promise.all(
      options.targets.map(async (target) => ({
        name: target.name,
        url: target.url,
        ok: await probeTarget(options.probe, target.url),
      })),
    );
    if (!shouldContinue()) return { status: "cancelled" };
    const failed = probed
      .filter((target) => !target.ok)
      .map((target) => ({ name: target.name, url: target.url }));
    if (failed.length === 0) return { status: "ready" };
    await options.onProgress?.(failed);
    if (!shouldContinue()) return { status: "cancelled" };
    if (now() >= deadline) return { status: "timeout", failed };
    await sleep(Math.min(intervalMs, Math.max(0, deadline - now())));
  }
  return { status: "cancelled" };
}

export function withReadinessFailures(
  statusPageUrl: string,
  failed: readonly ReadinessFailure[],
  options?: { pending?: boolean },
): string {
  const url = new URL(statusPageUrl);
  if (failed.length === 0) {
    url.search = "";
    return url.href;
  }
  const params = new URLSearchParams();
  if (options?.pending) params.set("pending", "1");
  params.set("failed", failed.map((failure) => failure.name).join(","));
  for (const failure of failed) params.set(failure.name, failure.url);
  url.search = params.toString();
  return url.href;
}

async function probeTarget(
  probe: (url: string) => Promise<boolean>,
  url: string,
): Promise<boolean> {
  try {
    return await probe(url);
  } catch {
    return false;
  }
}

export type ReadinessTarget = {
  name: string;
  url: string;
};

export type ReadinessFailure = {
  name: string;
  url: string;
};

export type ReadinessResult =
  | { status: "ready" }
  | { status: "cancelled" }
  | { status: "timeout"; failed: ReadinessFailure[] };

export type WaitUntilReadyOptions = {
  targets: readonly ReadinessTarget[];
  probe: (url: string) => Promise<boolean>;
  intervalMs?: number;
  timeoutMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => number;
  shouldContinue?: () => boolean;
  onProgress?: (failed: readonly ReadinessFailure[]) => Promise<void> | void;
};
