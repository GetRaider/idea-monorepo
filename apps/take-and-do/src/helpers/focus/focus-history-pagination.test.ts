import { describe, expect, it } from "vitest";

import type { FocusSession } from "@/types/focus.types";

import {
  FOCUS_HISTORY_PAGE_SIZE,
  getFocusHistoryVisibleSessions,
  getNextFocusHistoryVisibleCount,
  hasMoreFocusHistory,
} from "./focus-session.helper";

function buildFocusSession(index: number): FocusSession {
  return {
    id: `focus-${index}`,
    type: "focus",
    name: `Focus ${index}`,
    taskId: null,
    plannedDurationSeconds: 1500,
    actualDurationSeconds: 1500,
    startedAt: `2026-06-${String(index).padStart(2, "0")}T10:00:00.000Z`,
    endedAt: `2026-06-${String(index).padStart(2, "0")}T10:25:00.000Z`,
    status: "completed",
  };
}

describe("focus history pagination", () => {
  const sessions = Array.from({ length: 12 }, (_, index) =>
    buildFocusSession(index + 1),
  );

  it("shows the first page only by default", () => {
    expect(
      getFocusHistoryVisibleSessions(sessions, FOCUS_HISTORY_PAGE_SIZE),
    ).toHaveLength(FOCUS_HISTORY_PAGE_SIZE);
  });

  it("loads the next page in batches of three", () => {
    expect(getNextFocusHistoryVisibleCount(3, 12)).toBe(6);
    expect(getNextFocusHistoryVisibleCount(6, 12)).toBe(9);
    expect(getNextFocusHistoryVisibleCount(9, 12)).toBe(12);
    expect(getNextFocusHistoryVisibleCount(6, 8)).toBe(8);
    expect(getNextFocusHistoryVisibleCount(12, 12)).toBe(12);
  });

  it("reports when more history remains", () => {
    expect(hasMoreFocusHistory(3, 12)).toBe(true);
    expect(hasMoreFocusHistory(12, 12)).toBe(false);
  });
});
