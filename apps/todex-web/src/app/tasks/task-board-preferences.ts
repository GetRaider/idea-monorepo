"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_LIST_SORT,
  type ListSortState,
} from "./task-helpers";

export const BOARD_VIEW_MODE_STORAGE_KEY = "todex:board-view-mode:v1";
export const BOARD_LIST_SUBMODE_STORAGE_KEY = "todex:board-list-submode:v1";
export const BOARD_LIST_SORT_STORAGE_KEY = "todex:board-list-sort:v1";

export const DEFAULT_BOARD_VIEW_MODE: BoardViewMode = "kanban";
export const DEFAULT_BOARD_LIST_SUBMODE: BoardListSubmode = "grouped";

export function readJsonObject(storageKey: string): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function writeJsonObject(
  storageKey: string,
  value: Record<string, unknown>,
): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    /* private mode / quota */
  }
}

export function isBoardViewMode(value: unknown): value is BoardViewMode {
  return value === "kanban" || value === "list";
}

export function isBoardListSubmode(value: unknown): value is BoardListSubmode {
  return value === "grouped" || value === "single";
}

export function isListSortState(value: unknown): value is ListSortState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as {
    enabled?: unknown;
    field?: unknown;
    direction?: unknown;
  };
  return (
    typeof candidate.enabled === "boolean" &&
    (candidate.field === "title" ||
      candidate.field === "schedule" ||
      candidate.field === "priority") &&
    (candidate.direction === "asc" || candidate.direction === "desc")
  );
}

export function readBoardViewMode(contextKey: string): BoardViewMode {
  const stored = readJsonObject(BOARD_VIEW_MODE_STORAGE_KEY)[contextKey];
  return isBoardViewMode(stored) ? stored : DEFAULT_BOARD_VIEW_MODE;
}

export function readBoardListSubmode(contextKey: string): BoardListSubmode {
  const stored = readJsonObject(BOARD_LIST_SUBMODE_STORAGE_KEY)[contextKey];
  return isBoardListSubmode(stored) ? stored : DEFAULT_BOARD_LIST_SUBMODE;
}

export function readBoardListSort(contextKey: string): ListSortState {
  const stored = readJsonObject(BOARD_LIST_SORT_STORAGE_KEY)[contextKey];
  return isListSortState(stored) ? stored : DEFAULT_LIST_SORT;
}

export function useTaskBoardPreferences(contextKey: string | null) {
  const [viewMode, setViewModeState] = useState<BoardViewMode>(
    DEFAULT_BOARD_VIEW_MODE,
  );
  const [listSubmode, setListSubmodeState] = useState<BoardListSubmode>(
    DEFAULT_BOARD_LIST_SUBMODE,
  );
  const [listSort, setListSortState] = useState<ListSortState>(DEFAULT_LIST_SORT);

  useEffect(() => {
    if (!contextKey) return;
    setViewModeState(readBoardViewMode(contextKey));
    setListSubmodeState(readBoardListSubmode(contextKey));
    setListSortState(readBoardListSort(contextKey));
  }, [contextKey]);

  const setViewMode = useCallback(
    (next: BoardViewMode) => {
      setViewModeState(next);
      if (!contextKey) return;
      const map = readJsonObject(BOARD_VIEW_MODE_STORAGE_KEY);
      map[contextKey] = next;
      writeJsonObject(BOARD_VIEW_MODE_STORAGE_KEY, map);
    },
    [contextKey],
  );

  const setListSubmode = useCallback(
    (next: BoardListSubmode) => {
      setListSubmodeState(next);
      if (!contextKey) return;
      const map = readJsonObject(BOARD_LIST_SUBMODE_STORAGE_KEY);
      map[contextKey] = next;
      writeJsonObject(BOARD_LIST_SUBMODE_STORAGE_KEY, map);
    },
    [contextKey],
  );

  const setListSort = useCallback(
    (next: ListSortState) => {
      setListSortState(next);
      if (!contextKey) return;
      const map = readJsonObject(BOARD_LIST_SORT_STORAGE_KEY);
      map[contextKey] = next;
      writeJsonObject(BOARD_LIST_SORT_STORAGE_KEY, map);
    },
    [contextKey],
  );

  return {
    viewMode,
    listSubmode,
    listSort,
    setViewMode,
    setListSubmode,
    setListSort,
  };
}

export type BoardViewMode = "kanban" | "list";
export type BoardListSubmode = "grouped" | "single";
