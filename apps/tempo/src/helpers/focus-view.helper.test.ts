import { describe, expect, it } from "vitest";

import { resolveFocusViewState } from "./focus-view.helper";
import type { FocusRecord } from "../shared/records.types";

function makeRecord(overrides: Partial<FocusRecord> = {}): FocusRecord {
  return {
    id: "record-1",
    name: "Work",
    startedAt: "2026-09-10T10:00:00.000Z",
    endedAt: null,
    accumulatedSeconds: 0,
    segmentStartedAt: "2026-09-10T10:00:00.000Z",
    plannedSeconds: 600,
    mode: "stopwatch",
    source: "live",
    kind: "unknown",
    sessionId: null,
    scope: null,
    recordRole: "focus",
    ...overrides,
  };
}

describe("resolveFocusViewState", () => {
  it("is idle when both records are null", () => {
    expect(resolveFocusViewState(null, null)).toBe("idle");
  });

  it("is focusRunning when focus has a live segment", () => {
    expect(resolveFocusViewState(makeRecord(), null)).toBe("focusRunning");
  });

  it("is focusPaused when focus is frozen", () => {
    expect(
      resolveFocusViewState(makeRecord({ segmentStartedAt: null }), null),
    ).toBe("focusPaused");
  });

  it("is focusPausedBreakRunning when both records exist", () => {
    expect(
      resolveFocusViewState(
        makeRecord({ segmentStartedAt: null, recordRole: "focus" }),
        makeRecord({
          id: "break-1",
          name: "Break",
          recordRole: "break",
          mode: "timer",
        }),
      ),
    ).toBe("focusPausedBreakRunning");
  });

  it("is breakOnly when only a break record exists", () => {
    expect(
      resolveFocusViewState(
        null,
        makeRecord({
          id: "break-1",
          name: "Break",
          recordRole: "break",
          mode: "timer",
        }),
      ),
    ).toBe("breakOnly");
  });
});
