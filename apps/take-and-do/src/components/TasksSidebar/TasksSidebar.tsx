"use client";

import { ConfirmDialog } from "@/components/Dialogs";

import { TasksSidebarContainer } from "./TasksSidebar.ui";
import { TasksSidebarResizeHandle } from "./TasksSidebarResizeHandle";
import { TasksSidebarTaskSearch } from "./TasksSidebarTaskSearch";
import { TasksSidebarSchedulesSection } from "./TasksSidebarSchedulesSection";
import { TasksSidebarWorkspacesSection } from "./TasksSidebarWorkspacesSection";
import { useTasksSidebarModel } from "@/hooks/tasksSidebar/useTasksSidebarModel";

import type { TasksSidebarProps } from "./tasksSidebar.types";

export function TasksSidebar({
  isOpen,
  widthPx,
  onWidthPxChange,
  activeView = "today",
  onViewChange,
  onCreateTaskBoard,
  folders,
  taskBoards,
  setTaskBoards,
  setFolders,
  isFoldersLoading,
  isBoardsLoading,
}: TasksSidebarProps) {
  const model = useTasksSidebarModel({
    isOpen,
    widthPx,
    onWidthPxChange,
    activeView,
    onViewChange,
    onCreateTaskBoard,
    folders,
    taskBoards,
    setTaskBoards,
    setFolders,
    isFoldersLoading,
    isBoardsLoading,
  });

  const {
    deletingBoard,
    setDeletingBoard,
    deletingFolder,
    setDeletingFolder,
    handleDeleteConfirm,
    handleFolderDeleteConfirm,
  } = model;

  return (
    <>
      <TasksSidebarContainer isOpen={isOpen} widthPx={widthPx}>
        <TasksSidebarTaskSearch taskBoards={taskBoards} />

        <TasksSidebarSchedulesSection model={model} />

        <TasksSidebarWorkspacesSection
          model={model}
          onCreateTaskBoard={onCreateTaskBoard}
          isFoldersLoading={isFoldersLoading}
          isBoardsLoading={isBoardsLoading}
        />

        {isOpen ? (
          <TasksSidebarResizeHandle
            widthPx={widthPx}
            onWidthPxChange={onWidthPxChange}
          />
        ) : null}
      </TasksSidebarContainer>

      {deletingBoard && (
        <ConfirmDialog
          title={`Delete "${deletingBoard.name}" board?`}
          description="This will permanently delete the board and all its tasks. This action cannot be undone."
          confirmLabel="Delete board"
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingBoard(null)}
        />
      )}

      {deletingFolder && (
        <ConfirmDialog
          title={`Delete "${deletingFolder.name}" folder?`}
          description="The folder will be removed. Boards inside will move to the root. This action cannot be undone."
          confirmLabel="Delete folder"
          onClose={() => setDeletingFolder(null)}
          onConfirm={handleFolderDeleteConfirm}
        />
      )}
    </>
  );
}

export type { TasksSidebarProps } from "./tasksSidebar.types";
