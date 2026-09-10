import { describe, expect, it } from "vitest";

import {
  isTaskEditorChrome,
  readTaskEditorChrome,
  TASK_EDITOR_CHROME_STORAGE_KEY,
  writeTaskEditorChrome,
} from "./task-editor-chrome";
import { writeJsonObject } from "./task-board-preferences";

describe("task editor chrome", () => {
  const memory = new Map<string, string>();

  it("defaults to dock", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => memory.set(key, value),
      },
    });
    memory.clear();
    expect(readTaskEditorChrome()).toBe("dock");
  });

  it("persists dock vs overlay", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => memory.set(key, value),
      },
    });
    memory.clear();
    writeTaskEditorChrome("overlay");
    expect(readTaskEditorChrome()).toBe("overlay");
    writeJsonObject(TASK_EDITOR_CHROME_STORAGE_KEY, { chrome: "nope" });
    expect(readTaskEditorChrome()).toBe("dock");
    expect(isTaskEditorChrome("dock")).toBe(true);
  });
});
