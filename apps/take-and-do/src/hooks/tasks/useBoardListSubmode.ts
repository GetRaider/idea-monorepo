"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * List layout preference: three status sections vs. merged “Tasks + Done”.
 * Section structure and drop mapping live in `@/helpers/list-board.helper`.
 */
export type BoardListSubmode = "grouped" | "single";

const STORAGE_KEY = "take-and-do:board-list-submode:v1";
const DEFAULT_SUBMODE: BoardListSubmode = "grouped";

type SubmodeMap = Record<string, BoardListSubmode>;

function isSubmode(value: unknown): value is BoardListSubmode {
  return value === "grouped" || value === "single";
}

function readMap(): SubmodeMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: SubmodeMap = {};
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (isSubmode(value)) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function writeMap(map: SubmodeMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* no-op: storage may be unavailable */
  }
}

export function useBoardListSubmode(
  contextKey: string | null | undefined,
): [BoardListSubmode, (next: BoardListSubmode) => void] {
  const [submode, setSubmode] = useState<BoardListSubmode>(DEFAULT_SUBMODE);

  useEffect(() => {
    if (!contextKey) return;
    const stored = readMap()[contextKey];
    setSubmode(stored ?? DEFAULT_SUBMODE);
  }, [contextKey]);

  const setAndPersist = useCallback(
    (next: BoardListSubmode) => {
      setSubmode(next);
      if (!contextKey) return;
      const map = readMap();
      map[contextKey] = next;
      writeMap(map);
    },
    [contextKey],
  );

  return [submode, setAndPersist];
}
