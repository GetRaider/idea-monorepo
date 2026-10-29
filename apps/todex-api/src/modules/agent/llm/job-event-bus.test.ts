import { describe, expect, it } from "vitest";

import { planReplay, type SequencedJobEvent } from "./job-event-bus";

describe("planReplay", () => {
  it("skips events at or before after and ignores a duplicate seq", () => {
    const events = [event(1), event(2), event(3), event(3)];
    expect(planReplay(2, events, []).map((item) => item.seq)).toEqual([3]);
  });

  it("asks the client to resync when the log starts after the next seq", () => {
    expect(planReplay(2, [event(5)], []).map((item) => item.event.type)).toEqual(["resync"]);
  });

  it("delivers a publish that arrived before the log read once", () => {
    const published = event(4, "late");
    expect(planReplay(3, [event(4, "log")], [published])).toEqual([event(4, "log")]);
  });
});

function event(seq: number, text = "delta"): SequencedJobEvent {
  return { seq, event: { type: "delta", text } };
}
