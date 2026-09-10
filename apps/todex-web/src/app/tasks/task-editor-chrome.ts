"use client";

import { useCallback, useEffect, useState } from "react";

import { readJsonObject, writeJsonObject } from "./task-board-preferences";

export const TASK_EDITOR_CHROME_STORAGE_KEY = "todex:task-editor-chrome:v1";
export const DEFAULT_TASK_EDITOR_CHROME: TaskEditorChrome = "dock";

export function isTaskEditorChrome(value: unknown): value is TaskEditorChrome {
  return value === "overlay" || value === "dock";
}

export function readTaskEditorChrome(): TaskEditorChrome {
  const stored = readJsonObject(TASK_EDITOR_CHROME_STORAGE_KEY).chrome;
  return isTaskEditorChrome(stored) ? stored : DEFAULT_TASK_EDITOR_CHROME;
}

export function writeTaskEditorChrome(chrome: TaskEditorChrome): void {
  writeJsonObject(TASK_EDITOR_CHROME_STORAGE_KEY, { chrome });
}

export function useTaskEditorChrome(): {
  chrome: TaskEditorChrome;
  setChrome: (chrome: TaskEditorChrome) => void;
} {
  const [chrome, setChromeState] = useState<TaskEditorChrome>(
    DEFAULT_TASK_EDITOR_CHROME,
  );

  useEffect(() => {
    setChromeState(readTaskEditorChrome());
  }, []);

  const setChrome = useCallback((nextChrome: TaskEditorChrome) => {
    setChromeState(nextChrome);
    writeTaskEditorChrome(nextChrome);
  }, []);

  return { chrome, setChrome };
}

export type TaskEditorChrome = "overlay" | "dock";
