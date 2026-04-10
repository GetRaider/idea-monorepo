"use client";

import { useCallback, useEffect, useState } from "react";

import {
  clampTasksSidebarWidthPx,
  readStoredTasksSidebarWidthPx,
  TASKS_SIDEBAR_DEFAULT_WIDTH_PX,
  TASKS_SIDEBAR_WIDTH_STORAGE_KEY,
} from "@/helpers/tasks-sidebar-layout";

export function useTasksSidebarWidthPx(): [
  number,
  (nextWidth: number) => void,
] {
  const [widthPx, setWidthPx] = useState(TASKS_SIDEBAR_DEFAULT_WIDTH_PX);

  useEffect(() => {
    const stored = readStoredTasksSidebarWidthPx();
    if (stored != null) setWidthPx(stored);
  }, []);

  const setWidthPxPersist = useCallback((nextWidth: number) => {
    const next = clampTasksSidebarWidthPx(nextWidth);
    setWidthPx(next);
    window.localStorage.setItem(TASKS_SIDEBAR_WIDTH_STORAGE_KEY, String(next));
  }, []);

  return [widthPx, setWidthPxPersist];
}
