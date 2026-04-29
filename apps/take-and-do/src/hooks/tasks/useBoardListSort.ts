"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  ListSortDirection,
  ListSortField,
  ListSortState,
} from "@/helpers/list-sort.helper";

const STORAGE_KEY = "take-and-do:board-list-sort:v1";

const SORT_FIELDS: ListSortField[] = ["title", "schedule", "priority"];

const DEFAULT_SORT: ListSortState = {
  enabled: false,
  field: "title",
  direction: "asc",
};

type SortMap = Record<string, ListSortState>;

function isField(value: unknown): value is ListSortField {
  return SORT_FIELDS.includes(value as ListSortField);
}

function isDirection(value: unknown): value is ListSortDirection {
  return value === "asc" || value === "desc";
}

function isSortState(value: unknown): value is ListSortState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as {
    field?: unknown;
    direction?: unknown;
    enabled?: unknown;
  };
  // `enabled` was added later — treat legacy persisted entries (without it)
  // as disabled so users see the new "off-by-default" behaviour even if they
  // previously configured a field.
  return (
    isField(candidate.field) &&
    isDirection(candidate.direction) &&
    (candidate.enabled === undefined || typeof candidate.enabled === "boolean")
  );
}

function readMap(): SortMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: SortMap = {};
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (isSortState(value)) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function writeMap(map: SortMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* no-op: storage may be unavailable */
  }
}

/**
 * Per-context (board id, or schedule key like `schedule:today`) sort state for the
 * List view. Mirrors the persistence model used by `useBoardViewMode`.
 */
export function useBoardListSort(
  contextKey: string | null | undefined,
): [ListSortState, (next: ListSortState) => void] {
  const [sort, setSort] = useState<ListSortState>(DEFAULT_SORT);

  useEffect(() => {
    if (!contextKey) return;
    const stored = readMap()[contextKey];
    if (!stored) {
      setSort(DEFAULT_SORT);
      return;
    }
    setSort({
      enabled: stored.enabled ?? false,
      field: stored.field,
      direction: stored.direction,
    });
  }, [contextKey]);

  const setAndPersist = useCallback(
    (next: ListSortState) => {
      setSort(next);
      if (!contextKey) return;
      const map = readMap();
      map[contextKey] = next;
      writeMap(map);
    },
    [contextKey],
  );

  return [sort, setAndPersist];
}
