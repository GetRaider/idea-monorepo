import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BOARD_LIST_SORT_STORAGE_KEY,
  BOARD_LIST_SUBMODE_STORAGE_KEY,
  BOARD_VIEW_MODE_STORAGE_KEY,
  isBoardListSubmode,
  isBoardViewMode,
  isListSortState,
  readBoardListSort,
  readBoardListSubmode,
  readBoardViewMode,
  writeJsonObject,
} from "./task-board-preferences";

describe("task board preferences", () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    const localStorageStub = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
      clear: () => {
        memory.clear();
      },
    };
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageStub,
    });
  });

  afterEach(() => {
    memory.clear();
  });

  it("defaults view mode to kanban", () => {
    expect(readBoardViewMode("board-1")).toBe("kanban");
  });

  it("reads a stored view mode per context key", () => {
    writeJsonObject(BOARD_VIEW_MODE_STORAGE_KEY, {
      "board-1": "list",
      "schedule:today": "kanban",
    });
    expect(readBoardViewMode("board-1")).toBe("list");
    expect(readBoardViewMode("schedule:today")).toBe("kanban");
  });

  it("reads list submode and sort independently", () => {
    writeJsonObject(BOARD_LIST_SUBMODE_STORAGE_KEY, { "board-1": "single" });
    writeJsonObject(BOARD_LIST_SORT_STORAGE_KEY, {
      "board-1": { enabled: true, field: "schedule", direction: "desc" },
    });
    expect(readBoardListSubmode("board-1")).toBe("single");
    expect(readBoardListSort("board-1")).toEqual({
      enabled: true,
      field: "schedule",
      direction: "desc",
    });
  });

  it("rejects invalid stored values", () => {
    expect(isBoardViewMode("calendar")).toBe(false);
    expect(isBoardListSubmode("kanban")).toBe(false);
    expect(isListSortState({ field: "dueDate", direction: "asc" })).toBe(
      false,
    );
  });
});
