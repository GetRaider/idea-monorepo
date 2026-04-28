"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { guestStoreHelper } from "@/stores/guest";
import type { Folder, TaskBoard } from "@/types/workspace";

const STORAGE_KEY = "take-and-do:tasks-sidebar-order:v1";

export type TopLevelRow =
  | { kind: "folder"; id: string; folder: Folder }
  | { kind: "board"; id: string; board: TaskBoard };

type OrderState = {
  /** Interleaved folder ids and root-level task board ids (in-folder boards omitted). */
  topLevelIds: string[];
  boardsInFolder: Record<string, string[]>;
};

function emptyOrder(): OrderState {
  return { topLevelIds: [], boardsInFolder: {} };
}

function normalizeOrderState(parsed: unknown): OrderState {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return emptyOrder();
  }
  const p = parsed as Record<string, unknown>;
  const boardsInFolder: Record<string, string[]> = {};
  const bifRaw = p.boardsInFolder;
  if (bifRaw && typeof bifRaw === "object" && !Array.isArray(bifRaw)) {
    for (const [key, value] of Object.entries(bifRaw)) {
      if (Array.isArray(value)) {
        boardsInFolder[key] = value.filter(
          (id): id is string => typeof id === "string",
        );
      }
    }
  }

  if (Array.isArray(p.topLevelIds)) {
    return {
      topLevelIds: p.topLevelIds.filter(
        (id): id is string => typeof id === "string",
      ),
      boardsInFolder,
    };
  }

  const legacyFolders = Array.isArray(p.folderIds)
    ? p.folderIds.filter((id): id is string => typeof id === "string")
    : [];
  const legacyRoots = Array.isArray(p.rootBoardIds)
    ? p.rootBoardIds.filter((id): id is string => typeof id === "string")
    : [];
  return {
    topLevelIds: [...legacyFolders, ...legacyRoots],
    boardsInFolder,
  };
}

function readStorage(): OrderState {
  if (typeof window === "undefined") return emptyOrder();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyOrder();
    return normalizeOrderState(JSON.parse(raw) as unknown);
  } catch {
    return emptyOrder();
  }
}

function writeStorage(next: OrderState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      topLevelIds: next.topLevelIds,
      boardsInFolder: next.boardsInFolder,
    }),
  );
}

function mergeIds(current: string[], preferred: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of preferred) {
    if (current.includes(id) && !seen.has(id)) {
      out.push(id);
      seen.add(id);
    }
  }
  for (const id of current) {
    if (!seen.has(id)) {
      out.push(id);
      seen.add(id);
    }
  }
  return out;
}

function reorderBeforeTarget(
  ids: string[],
  activeId: string,
  beforeId: string,
): string[] {
  if (activeId === beforeId) return ids;
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(beforeId);
  if (from === -1 || to === -1) return ids;
  const next = [...ids];
  const [removed] = next.splice(from, 1);
  const insertAt = next.indexOf(beforeId);
  if (insertAt === -1) {
    next.push(removed);
    return next;
  }
  next.splice(insertAt, 0, removed);
  return next;
}

function readInitialOrder(): OrderState {
  const fromStorage = readStorage();
  if (typeof window === "undefined") return fromStorage;
  const fromGuest = guestStoreHelper.getSidebarOrder();
  if (
    fromGuest &&
    (fromGuest.topLevelIds?.length ||
      Object.keys(fromGuest.boardsInFolder ?? {}).length)
  ) {
    return normalizeOrderState(fromGuest);
  }
  return fromStorage;
}

export function useTasksSidebarOrder(
  folders: Folder[],
  taskBoards: TaskBoard[],
) {
  const isAnonymous = useIsAnonymous();
  const [order, setOrder] = useState<OrderState>(readInitialOrder);

  useEffect(() => {
    if (!isAnonymous) return;
    const fromGuest = guestStoreHelper.getSidebarOrder();
    if (
      fromGuest &&
      (fromGuest.topLevelIds?.length ||
        Object.keys(fromGuest.boardsInFolder ?? {}).length)
    ) {
      setOrder(normalizeOrderState(fromGuest));
    }
  }, [isAnonymous]);

  const currentFolderIds = useMemo(
    () => folders.map((folder) => folder.id),
    [folders],
  );

  const currentRootBoardIds = useMemo(
    () =>
      taskBoards.filter((board) => !board.folderId).map((board) => board.id),
    [taskBoards],
  );

  const currentTopLevelIds = useMemo(
    () => [...currentFolderIds, ...currentRootBoardIds],
    [currentFolderIds, currentRootBoardIds],
  );

  const sortedTopLevelIds = useMemo(
    () => mergeIds(currentTopLevelIds, order.topLevelIds),
    [currentTopLevelIds, order.topLevelIds],
  );

  const sortedTopLevelRows = useMemo((): TopLevelRow[] => {
    const rows: TopLevelRow[] = [];
    for (const id of sortedTopLevelIds) {
      const folder = folders.find((f) => f.id === id);
      if (folder) {
        rows.push({ kind: "folder", id, folder });
        continue;
      }
      const board = taskBoards.find((b) => b.id === id && !b.folderId);
      if (board) rows.push({ kind: "board", id, board });
    }
    return rows;
  }, [sortedTopLevelIds, folders, taskBoards]);

  const boardsInFolderSorted = useCallback(
    (folderId: string) => {
      const inFolder = taskBoards
        .filter((board) => board.folderId === folderId)
        .map((board) => board.id);
      const preferred = order.boardsInFolder[folderId] ?? [];
      const merged = mergeIds(inFolder, preferred);
      return merged
        .map((id) => taskBoards.find((board) => board.id === id))
        .filter((board): board is TaskBoard => board != null);
    },
    [taskBoards, order.boardsInFolder],
  );

  const persist = useCallback(
    (next: OrderState) => {
      writeStorage(next);
      setOrder(next);
      if (isAnonymous) {
        guestStoreHelper.setSidebarOrder({
          topLevelIds: next.topLevelIds,
          boardsInFolder: next.boardsInFolder,
        });
      }
    },
    [isAnonymous],
  );

  const reorderTopLevel = useCallback(
    (activeId: string, beforeId: string) => {
      if (activeId === beforeId) return;
      const merged = mergeIds(currentTopLevelIds, order.topLevelIds);
      const nextIds = reorderBeforeTarget(merged, activeId, beforeId);
      if (nextIds === merged) return;
      persist({ ...order, topLevelIds: nextIds });
    },
    [currentTopLevelIds, order, persist],
  );

  /** Root board leaves the top strip (e.g. moved into a folder). */
  const removeFromTopLevel = useCallback(
    (boardId: string) => {
      const merged = mergeIds(currentTopLevelIds, order.topLevelIds);
      if (!merged.includes(boardId)) return;
      const nextIds = merged.filter((id) => id !== boardId);
      persist({ ...order, topLevelIds: nextIds });
    },
    [currentTopLevelIds, order, persist],
  );

  /** Root board enters the top strip (e.g. moved out of a folder). */
  const insertRootBoardTopLevel = useCallback(
    (boardId: string, beforeId: string | null) => {
      const merged = mergeIds(currentTopLevelIds, order.topLevelIds).filter(
        (id) => id !== boardId,
      );
      let nextIds: string[];
      if (beforeId == null) {
        nextIds = [...merged, boardId];
      } else {
        const i = merged.indexOf(beforeId);
        if (i === -1) nextIds = [...merged, boardId];
        else nextIds = [...merged.slice(0, i), boardId, ...merged.slice(i)];
      }
      persist({ ...order, topLevelIds: nextIds });
    },
    [currentTopLevelIds, order, persist],
  );

  const reorderBoardInFolder = useCallback(
    (folderId: string, activeId: string, overId: string) => {
      const inFolder = taskBoards
        .filter((board) => board.folderId === folderId)
        .map((board) => board.id);
      const preferred = order.boardsInFolder[folderId] ?? [];
      const merged = mergeIds(inFolder, preferred);
      const nextIds = reorderBeforeTarget(merged, activeId, overId);
      if (nextIds === merged) return;
      persist({
        ...order,
        boardsInFolder: { ...order.boardsInFolder, [folderId]: nextIds },
      });
    },
    [order, persist, taskBoards],
  );

  const moveTopLevelToEnd = useCallback(
    (activeId: string) => {
      const merged = mergeIds(currentTopLevelIds, order.topLevelIds).filter(
        (id) => id !== activeId,
      );
      merged.push(activeId);
      persist({ ...order, topLevelIds: merged });
    },
    [currentTopLevelIds, order, persist],
  );

  return {
    sortedTopLevelRows,
    boardsInFolderSorted,
    reorderTopLevel,
    reorderBoardInFolder,
    removeFromTopLevel,
    insertRootBoardTopLevel,
    moveTopLevelToEnd,
  };
}
