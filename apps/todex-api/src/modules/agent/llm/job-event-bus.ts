import { Inject, Injectable, Logger } from "@nestjs/common";
import type Redis from "ioredis";

import { REDIS } from "../../../db/tokens";

const LOG_LIMIT = 500;
const LOG_TTL_SECONDS = 60 * 60;

@Injectable()
export class JobEventBus {
  private readonly logger = new Logger(JobEventBus.name);

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async publish(jobId: string, event: JobStreamEvent): Promise<void> {
    try {
      const seq = await this.redis.incr(seqKey(jobId));
      const payload = JSON.stringify({ seq, event });
      await this.redis
        .multi()
        .rpush(logKey(jobId), payload)
        .ltrim(logKey(jobId), -LOG_LIMIT, -1)
        .expire(logKey(jobId), LOG_TTL_SECONDS)
        .publish(channel(jobId), payload)
        .exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : "publish failed";
      this.logger.warn(`Job ${jobId} event publish failed: ${message}`);
    }
  }

  async attach(
    jobId: string,
    after: number,
    onEvent: (event: SequencedJobEvent) => void,
  ): Promise<() => void> {
    const subscriber = this.redis.duplicate();
    const name = channel(jobId);
    const buffer: SequencedJobEvent[] = [];
    let live = false;
    const onMessage = (channelName: string, message: string) => {
      if (channelName !== name) return;
      const event = readSequenced(message);
      if (!event) return;
      if (!live) buffer.push(event);
      else onEvent(event);
    };
    subscriber.on("message", onMessage);
    await subscriber.subscribe(name);
    const rows = await this.redis.lrange(logKey(jobId), 0, -1);
    const replay = rows.flatMap((row) => {
      const event = readSequenced(row);
      return event ? [event] : [];
    });
    const seen = new Set<number>();
    const emit = (event: SequencedJobEvent) => {
      if (event.seq > 0 && (event.seq <= after || seen.has(event.seq))) return;
      if (event.seq > 0) seen.add(event.seq);
      onEvent(event);
    };
    const queued = buffer.splice(0, buffer.length);
    live = true;
    for (const event of planReplay(after, replay, queued)) emit(event);
    return () => {
      subscriber.off("message", onMessage);
      void subscriber.unsubscribe(name).finally(() => {
        void subscriber.quit();
      });
    };
  }
}

export function planReplay(
  after: number,
  replay: SequencedJobEvent[],
  buffered: SequencedJobEvent[],
): SequencedJobEvent[] {
  const ordered = [...replay, ...buffered]
    .filter((event) => event.seq > after)
    .sort((left, right) => left.seq - right.seq);
  const unique: SequencedJobEvent[] = [];
  const seen = new Set<number>();
  for (const event of ordered) {
    if (seen.has(event.seq)) continue;
    seen.add(event.seq);
    unique.push(event);
  }
  if (unique.length === 0) return [];
  if (unique[0]!.seq > after + 1) return [{ seq: 0, event: { type: "resync" } }];
  return unique;
}

function channel(jobId: string): string {
  return `agent:job:${jobId}:events`;
}

function logKey(jobId: string): string {
  return `agent:job:${jobId}:log`;
}

function seqKey(jobId: string): string {
  return `agent:job:${jobId}:seq`;
}

function readSequenced(message: string): SequencedJobEvent | null {
  try {
    const parsed = JSON.parse(message) as { seq?: unknown; event?: JobStreamEvent };
    if (typeof parsed.seq !== "number" || !parsed.event) return null;
    if (parsed.event.type === "delta" && typeof parsed.event.text === "string") {
      return { seq: parsed.seq, event: parsed.event };
    }
    if (parsed.event.type === "status" && typeof parsed.event.status === "string") {
      return { seq: parsed.seq, event: parsed.event };
    }
    return null;
  } catch {
    return null;
  }
}

export type JobStreamEvent =
  | { type: "delta"; text: string }
  | { type: "status"; status: string }
  | { type: "resync" };

export interface SequencedJobEvent {
  seq: number;
  event: JobStreamEvent;
}
