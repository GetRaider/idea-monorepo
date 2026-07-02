"use client";

import { ConfirmDialog } from "@/components/Dialogs";

import type { Folder, TaskBoard } from "@/types/workspace";

export function TasksSidebarDeleteDialogs({
  deletingBoard,
  deletingFolder,
  onCloseBoard,
  onCloseFolder,
  onConfirmBoard,
  onConfirmFolder,
}: TasksSidebarDeleteDialogsProps) {
  return (
    <>
      {deletingBoard ? (
        <ConfirmDialog
          title={`Delete "${deletingBoard.name}" board?`}
          description="This will permanently delete the board and all its tasks. This action cannot be undone."
          confirmLabel="Delete board"
          onConfirm={onConfirmBoard}
          onClose={onCloseBoard}
        />
      ) : null}

      {deletingFolder ? (
        <ConfirmDialog
          title={`Delete "${deletingFolder.name}" folder?`}
          description="The folder will be removed. Boards inside will move to the root. This action cannot be undone."
          confirmLabel="Delete folder"
          onClose={onCloseFolder}
          onConfirm={onConfirmFolder}
        />
      ) : null}
    </>
  );
}

type TasksSidebarDeleteDialogsProps = {
  deletingBoard: TaskBoard | null;
  deletingFolder: Folder | null;
  onCloseBoard: () => void;
  onCloseFolder: () => void;
  onConfirmBoard: () => void;
  onConfirmFolder: () => void;
};
