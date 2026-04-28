"use client";

import { useCallback, useEffect, useState } from "react";

export type BoardViewMode = "kanban" | "list";

const STORAGE_KEY = "take-and-do:board-view-mode:v1";
const DEFAULT_VIEW_MODE: BoardViewMode = "kanban";

type ViewModeMap = Record<string, BoardViewMode>;

function isViewMode(value: unknown): value is BoardViewMode {
  return value === "kanban" || value === "list";
}

function readMap(): ViewModeMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: ViewModeMap = {};
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (isViewMode(value)) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function writeMap(map: ViewModeMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* no-op: storage may be unavailable */
  }
}

/**
 * Per-context (board id, or schedule key like `schedule:today`) view mode persisted in localStorage.
 */
export function useBoardViewMode(
  contextKey: string | null | undefined,
): [BoardViewMode, (next: BoardViewMode) => void] {
  const [viewMode, setViewMode] = useState<BoardViewMode>(DEFAULT_VIEW_MODE);

  useEffect(() => {
    if (!contextKey) return;
    const stored = readMap()[contextKey];
    setViewMode(stored ?? DEFAULT_VIEW_MODE);
  }, [contextKey]);

  const setAndPersist = useCallback(
    (next: BoardViewMode) => {
      setViewMode(next);
      if (!contextKey) return;
      const map = readMap();
      map[contextKey] = next;
      writeMap(map);
    },
    [contextKey],
  );

  return [viewMode, setAndPersist];
}
