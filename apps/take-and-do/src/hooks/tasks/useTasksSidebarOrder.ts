"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { guestStoreHelper } from "@/stores/guest";
import type { Folder, TaskBoard } from "@/types/workspace";

const STORAGE_KEY = "take-and-do:tasks-sidebar-order:v1";

type OrderState = {
  folderIds: string[];
  rootBoardIds: string[];
  boardsInFolder: Record<string, string[]>;
};

function readStorage(): OrderState {
  if (typeof window === "undefined") {
    return { folderIds: [], rootBoardIds: [], boardsInFolder: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { folderIds: [], rootBoardIds: [], boardsInFolder: {} };
    const parsed = JSON.parse(raw) as Partial<OrderState>;
    return {
      folderIds: Array.isArray(parsed.folderIds) ? parsed.folderIds : [],
      rootBoardIds: Array.isArray(parsed.rootBoardIds)
        ? parsed.rootBoardIds
        : [],
      boardsInFolder:
        parsed.boardsInFolder && typeof parsed.boardsInFolder === "object"
          ? parsed.boardsInFolder
          : {},
    };
  } catch {
    return { folderIds: [], rootBoardIds: [], boardsInFolder: {} };
  }
}

function writeStorage(next: OrderState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
  overId: string,
): string[] {
  if (activeId === overId) return ids;
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from === -1 || to === -1) return ids;
  const next = [...ids];
  const [removed] = next.splice(from, 1);
  const insertAt = next.indexOf(overId);
  next.splice(insertAt, 0, removed);
  return next;
}

function readInitialOrder(): OrderState {
  const fromStorage = readStorage();
  if (typeof window === "undefined") return fromStorage;
  const fromGuest = guestStoreHelper.getSidebarOrder();
  if (
    fromGuest &&
    (fromGuest.folderIds.length > 0 ||
      fromGuest.rootBoardIds.length > 0 ||
      Object.keys(fromGuest.boardsInFolder).length > 0)
  ) {
    return {
      folderIds: fromGuest.folderIds,
      rootBoardIds: fromGuest.rootBoardIds,
      boardsInFolder: { ...fromGuest.boardsInFolder },
    };
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
      (fromGuest.folderIds.length > 0 ||
        fromGuest.rootBoardIds.length > 0 ||
        Object.keys(fromGuest.boardsInFolder).length > 0)
    ) {
      setOrder({
        folderIds: fromGuest.folderIds,
        rootBoardIds: fromGuest.rootBoardIds,
        boardsInFolder: { ...fromGuest.boardsInFolder },
      });
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

  const sortedFolderIds = useMemo(
    () => mergeIds(currentFolderIds, order.folderIds),
    [currentFolderIds, order.folderIds],
  );

  const sortedFolders = useMemo(
    () =>
      sortedFolderIds
        .map((id) => folders.find((folder) => folder.id === id))
        .filter((folder): folder is Folder => folder != null),
    [sortedFolderIds, folders],
  );

  const sortedRootBoardIds = useMemo(
    () => mergeIds(currentRootBoardIds, order.rootBoardIds),
    [currentRootBoardIds, order.rootBoardIds],
  );

  const rootBoardsSorted = useMemo(
    () =>
      sortedRootBoardIds
        .map((id) =>
          taskBoards.find((board) => board.id === id && !board.folderId),
        )
        .filter((board): board is TaskBoard => board != null),
    [sortedRootBoardIds, taskBoards],
  );

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
        guestStoreHelper.setSidebarOrder(next);
      }
    },
    [isAnonymous],
  );

  const reorderFolder = useCallback(
    (activeId: string, overId: string) => {
      const merged = mergeIds(currentFolderIds, order.folderIds);
      const nextIds = reorderBeforeTarget(merged, activeId, overId);
      if (nextIds === merged) return;
      persist({ ...order, folderIds: nextIds });
    },
    [currentFolderIds, order, persist],
  );

  const reorderRootBoard = useCallback(
    (activeId: string, overId: string) => {
      const merged = mergeIds(currentRootBoardIds, order.rootBoardIds);
      const nextIds = reorderBeforeTarget(merged, activeId, overId);
      if (nextIds === merged) return;
      persist({ ...order, rootBoardIds: nextIds });
    },
    [currentRootBoardIds, order, persist],
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

  return {
    sortedFolders,
    rootBoardsSorted,
    boardsInFolderSorted,
    reorderFolder,
    reorderRootBoard,
    reorderBoardInFolder,
  };
}
