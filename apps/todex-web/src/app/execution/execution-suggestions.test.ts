import { describe, expect, it } from "vitest";
import type { ExecutionSuggestion } from "@repo/api/todex";

import {
  EMPTY_SUGGESTION_FILTERS,
  applySuggestionFilters,
  suggestionAreas,
} from "./execution-suggestions";

describe("suggestion filters", () => {
  const now = new Date(2026, 9, 8, 12, 0, 0);

  it("keeps today's scheduled tasks and sorts critical first", () => {
    const tasks = applySuggestionFilters(
      [
        suggestion({ id: "low", priority: "low", scheduleDate: localIso(2026, 9, 8) }),
        suggestion({
          id: "critical",
          priority: "critical",
          scheduleDate: localIso(2026, 9, 8),
        }),
        suggestion({
          id: "later",
          priority: "high",
          scheduleDate: localIso(2026, 9, 20),
        }),
      ],
      { ...EMPTY_SUGGESTION_FILTERS, schedule: "today" },
      now,
    );

    expect(tasks.map((task) => task.id)).toEqual(["critical", "low"]);
  });

  it("filters a board area and an estimation bucket", () => {
    const tasks = [
      suggestion({ id: "short", estimation: 20, areaName: "Job Search", isDefaultArea: false }),
      suggestion({ id: "long", estimation: 180, areaName: "Job Search", isDefaultArea: false }),
      suggestion({ id: "other", estimation: 20, areaName: "General", isDefaultArea: true }),
    ];

    expect(suggestionAreas(tasks, "all")).toEqual(["Job Search"]);
    expect(
      applySuggestionFilters(
        tasks,
        { ...EMPTY_SUGGESTION_FILTERS, areaName: "Job Search", estimation: "short" },
        now,
      ).map((task) => task.id),
    ).toEqual(["short"]);
  });

  it("filters overdue due dates and tasks with no stage", () => {
    const tasks = applySuggestionFilters(
      [
        suggestion({ id: "overdue", dueDate: localIso(2026, 9, 1), stageName: "Build" }),
        suggestion({ id: "future", dueDate: localIso(2026, 9, 20), stageName: null }),
        suggestion({ id: "open", dueDate: null, stageName: null }),
      ],
      { ...EMPTY_SUGGESTION_FILTERS, due: "overdue", stage: "none", sort: "due" },
      now,
    );

    expect(tasks.map((task) => task.id)).toEqual([]);
    expect(
      applySuggestionFilters(
        [
          suggestion({ id: "overdue", dueDate: localIso(2026, 9, 1), stageName: null }),
          suggestion({ id: "future", dueDate: localIso(2026, 9, 20), stageName: null }),
        ],
        { ...EMPTY_SUGGESTION_FILTERS, due: "overdue" },
        now,
      ).map((task) => task.id),
    ).toEqual(["overdue"]);
  });
});

function suggestion(overrides: Partial<ExecutionSuggestion>): ExecutionSuggestion {
  return {
    id: "task",
    taskKey: "T-1",
    summary: "Write",
    priority: "medium",
    estimation: 60,
    scheduleDate: null,
    dueDate: null,
    boardId: "board",
    boardName: "Software Growth",
    areaName: "General",
    isDefaultArea: true,
    stageName: null,
    ...overrides,
  };
}

function localIso(year: number, month: number, day: number) {
  return new Date(year, month, day, 9, 0, 0).toISOString();
}
