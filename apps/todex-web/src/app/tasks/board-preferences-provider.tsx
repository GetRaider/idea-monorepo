"use client";

import { createContext, use, type ReactNode } from "react";

import { useTasks } from "./tasks-provider";
import {
  useTaskBoardPreferences,
  type BoardListSubmode,
  type BoardViewMode,
} from "./task-board-preferences";
import type { ListSortState } from "./task-helpers";

const BoardPreferencesContext = createContext<BoardPreferences | null>(null);

export function BoardPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    state: { view },
  } = useTasks();
  const contextKey =
    view.kind === "board"
      ? view.boardId
      : view.kind === "schedule"
        ? `schedule:${view.schedule}`
        : null;
  const preferences = useTaskBoardPreferences(contextKey);

  return (
    <BoardPreferencesContext value={preferences}>
      {children}
    </BoardPreferencesContext>
  );
}

export function useBoardPreferences() {
  const value = use(BoardPreferencesContext);
  if (!value) {
    throw new Error(
      "useBoardPreferences must be used within BoardPreferencesProvider",
    );
  }
  return value;
}

interface BoardPreferences {
  viewMode: BoardViewMode;
  listSubmode: BoardListSubmode;
  listSort: ListSortState;
  setViewMode: (next: BoardViewMode) => void;
  setListSubmode: (next: BoardListSubmode) => void;
  setListSort: (next: ListSortState) => void;
}
