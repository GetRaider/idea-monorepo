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
});
