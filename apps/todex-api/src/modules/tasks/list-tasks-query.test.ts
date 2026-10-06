import { describe, expect, it } from "vitest";

import {
  CreateTaskBodySchema,
  ListTasksQuerySchema,
  UpdateTaskBodySchema,
} from "@repo/api/todex";

describe("ListTasksQuerySchema", () => {
  it("accepts boardId alone", () => {
    expect(ListTasksQuerySchema.parse({ boardId: "board-1" })).toEqual({
      boardId: "board-1",
    });
  });

  it("accepts a schedule range alone", () => {
    const query = {
      scheduleFrom: "2026-09-10T00:00:00.000Z",
      scheduleTo: "2026-09-11T00:00:00.000Z",
    };
    expect(ListTasksQuerySchema.parse(query)).toEqual(query);
  });

  it("rejects neither boardId nor schedule range", () => {
    expect(ListTasksQuerySchema.safeParse({}).success).toBe(false);
  });

  it("rejects boardId and schedule range together", () => {
    expect(
      ListTasksQuerySchema.safeParse({
        boardId: "board-1",
        scheduleFrom: "2026-09-10T00:00:00.000Z",
        scheduleTo: "2026-09-11T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("rejects a partial schedule range", () => {
    expect(
      ListTasksQuerySchema.safeParse({
        scheduleFrom: "2026-09-10T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("rejects scheduleTo that is not after scheduleFrom", () => {
    expect(
      ListTasksQuerySchema.safeParse({
        scheduleFrom: "2026-09-10T00:00:00.000Z",
        scheduleTo: "2026-09-10T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});

describe("task date bodies", () => {
  it("allows scheduleDate and dueDate independently on create", () => {
    const body = CreateTaskBodySchema.parse({
      taskBoardId: "board-1",
      summary: "Plan it",
      scheduleDate: "2026-09-10T00:00:00.000Z",
      dueDate: "2026-09-17T00:00:00.000Z",
    });
    expect(body.scheduleDate).toBe("2026-09-10T00:00:00.000Z");
    expect(body.dueDate).toBe("2026-09-17T00:00:00.000Z");
  });

  it("allows clearing scheduleDate without touching dueDate", () => {
    const body = UpdateTaskBodySchema.parse({ scheduleDate: null });
    expect(body).toEqual({ scheduleDate: null });
  });

  it("accepts an acceptance criteria checklist", () => {
    const body = UpdateTaskBodySchema.parse({
      acceptanceCriteria: [
        { id: "criterion-1", text: " Reviewed ", done: false },
      ],
    });
    expect(body.acceptanceCriteria).toEqual([
      { id: "criterion-1", text: "Reviewed", done: false },
    ]);
  });

  it("accepts a weekly recurrence and clearing it", () => {
    const recurrence = {
      frequency: "weekly" as const,
      interval: 2,
      weekdays: ["MO", "WE"] as const,
      timeZone: "UTC",
      end: { type: "count" as const, count: 4 },
    };
    expect(UpdateTaskBodySchema.parse({ recurrence }).recurrence).toEqual(
      recurrence,
    );
    expect(UpdateTaskBodySchema.parse({ recurrence: null }).recurrence).toBe(
      null,
    );
  });

  it("rejects weekdays on a daily recurrence", () => {
    expect(
      UpdateTaskBodySchema.safeParse({
        recurrence: {
          frequency: "daily",
          interval: 1,
          weekdays: ["MO"],
          timeZone: "UTC",
          end: { type: "never" },
        },
      }).success,
    ).toBe(false);
  });

  it("rejects a blank acceptance criterion", () => {
    expect(
      UpdateTaskBodySchema.safeParse({
        acceptanceCriteria: [{ id: "criterion-1", text: "  ", done: false }],
      }).success,
    ).toBe(false);
  });
});
