import { describe, expect, it } from "vitest";

import type { FocusRecord } from "../shared/records.types";

import {
  buildBreakStartRecord,
  isDefaultBreakSessionName,
  validateStartBreak,
} from "./break.helper";

const savedSession = {
  id: "session-break",
  name: "Break",
  color: "#ff0000",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function createFocusRecord(
  overrides: Partial<FocusRecord> = {},
): FocusRecord {
  return {
    id: "focus-1",
    name: "Deep work",
    scope: null,
    startedAt: "2026-01-01T00:00:00.000Z",
    endedAt: null,
    accumulatedSeconds: 120,
    segmentStartedAt: null,
    plannedSeconds: null,
    mode: "stopwatch",
    source: "live",
    kind: "unknown",
    sessionId: null,
    recordRole: "focus",
    ...overrides,
  };
}

describe("isDefaultBreakSessionName", () => {
  it("matches Break case-insensitively", () => {
    expect(isDefaultBreakSessionName("Break")).toBe(true);
    expect(isDefaultBreakSessionName("break")).toBe(true);
    expect(isDefaultBreakSessionName("Focus")).toBe(false);
  });
});

describe("validateStartBreak", () => {
  it("rejects when break is already active", () => {
    expect(() =>
      validateStartBreak({
        plannedSeconds: 600,
        activeFocus: null,
        activeBreak: createFocusRecord({ recordRole: "break" }),
      }),
    ).toThrow("A break is already running");
  });

  it("rejects when focus is still running", () => {
    expect(() =>
      validateStartBreak({
        plannedSeconds: 600,
        activeFocus: createFocusRecord({
          segmentStartedAt: "2026-01-01T00:02:00.000Z",
        }),
        activeBreak: null,
      }),
    ).toThrow("Pause focus before starting a break");
  });

  it("allows break when focus is paused or absent", () => {
    expect(() =>
      validateStartBreak({
        plannedSeconds: 600,
        activeFocus: createFocusRecord({ segmentStartedAt: null }),
        activeBreak: null,
      }),
    ).not.toThrow();

    expect(() =>
      validateStartBreak({
        plannedSeconds: 600,
        activeFocus: null,
        activeBreak: null,
      }),
    ).not.toThrow();
  });
});

describe("buildBreakStartRecord", () => {
  it("creates a countdown break record linked to backlog", () => {
    const record = buildBreakStartRecord(
      600,
      savedSession,
      "break-1",
      "2026-01-01T00:00:00.000Z",
    );

    expect(record).toMatchObject({
      id: "break-1",
      name: "Break",
      mode: "timer",
      plannedSeconds: 600,
      kind: "backlog",
      sessionId: savedSession.id,
      recordRole: "break",
    });
  });
});
