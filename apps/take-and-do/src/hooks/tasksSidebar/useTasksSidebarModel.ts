"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { TasksSidebarProps } from "@/components/TasksSidebar/tasksSidebar.types";
import {
  DRAG_BOARD_KEY,
  DRAG_REORDER_BOARD_KEY,
  DRAG_REORDER_FOLDER_KEY,
  isRootDrop,
} from "@/constants/tasksSidebar.constants";
import { useTasksSidebarOrder } from "@/hooks/tasks/useTasksSidebarOrder";
import { isDuplicateWorkspaceName } from "@/helpers/workspace-name.helper";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { invalidateWorkspaceQueries } from "@/lib/invalidate-app-queries";
import { clientServices } from "@/services";
import type { Folder, TaskBoard } from "@/types/workspace";

import { useEmojiPickerState } from "./useEmojiPickerState";
import { useSidebarDeleteState } from "./useSidebarDeleteState";
import { useSidebarEditingState } from "./useSidebarEditingState";

export function useTasksSidebarModel({
  activeView = "today",
  onViewChange,
  folders,
  taskBoards,
  setTaskBoards,
  setFolders,
}: TasksSidebarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedFolder, setExpandedFolder] = useState<string>("");
  const [openMenuBoardId, setOpenMenuBoardId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [openMenuFolderId, setOpenMenuFolderId] = useState<string | null>(null);
  const {
    editingBoardId,
    setEditingBoardId,
    editingName,
    setEditingName,
    editingFolderId,
    setEditingFolderId,
    editingFolderName,
    setEditingFolderName,
    startBoardEdit,
    startFolderEdit,
  } = useSidebarEditingState();
  const { deletingBoard, setDeletingBoard, deletingFolder, setDeletingFolder } =
    useSidebarDeleteState();
  const {
    editingBoardEmoji,
    setEditingBoardEmoji,
    openBoardEmojiPickerId,
    setOpenBoardEmojiPickerId,
    editingFolderEmoji,
    setEditingFolderEmoji,
    openFolderEmojiPickerId,
    setOpenFolderEmojiPickerId,
  } = useEmojiPickerState();

  const {
    sortedFolders,
    rootBoardsSorted,
    boardsInFolderSorted,
    reorderFolder,
    reorderRootBoard,
    reorderBoardInFolder,
  } = useTasksSidebarOrder(folders, taskBoards);

  useEffect(() => {
    const endDrag = () => setDragOverTarget(null);
    window.addEventListener("dragend", endDrag);
    return () => window.removeEventListener("dragend", endDrag);
  }, []);

  useEffect(() => {
    if (!editingBoardId && !editingFolderId) return;

    const cancelInlineEditIfOutside = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-sidebar-inline-edit]")) return;
      if (target.closest("[data-dropdown-portal]")) return;
      if (target.closest("[data-emoji-picker-popover]")) return;
      if (target.closest("[data-emoji-trigger]")) return;
      setEditingBoardId(null);
      setEditingFolderId(null);
      setOpenBoardEmojiPickerId(null);
      setOpenFolderEmojiPickerId(null);
    };

    document.addEventListener("pointerdown", cancelInlineEditIfOutside, true);
    return () =>
      document.removeEventListener(
        "pointerdown",
        cancelInlineEditIfOutside,
        true,
      );
  }, [
    editingBoardId,
    editingFolderId,
    setEditingBoardId,
    setEditingFolderId,
    setOpenBoardEmojiPickerId,
    setOpenFolderEmojiPickerId,
  ]);

  const handleViewChange = (view: string) => onViewChange?.(view);

  const toggleFolder = (folderId: string) =>
    setExpandedFolder(expandedFolder === folderId ? "" : folderId);

  const handleEditStart = (board: TaskBoard) => {
    const boardEmoji = startBoardEdit(board);
    setEditingBoardEmoji(boardEmoji);
    setOpenBoardEmojiPickerId(null);
  };

  const handleEditBoard = useCallback(
    async (
      board: TaskBoard,
      opts?: {
        emoji?: string | null;
      },
    ) => {
      const trimmedName = editingName.trim();
      // `opts?.emoji === undefined` means "don't change emoji".
      // If it's `null`, that's a real "clear emoji" request.
      const desiredEmoji =
        opts?.emoji === undefined ? editingBoardEmoji : (opts?.emoji ?? null);

      const nameChanged = !!trimmedName && trimmedName !== (board.name ?? "");
      const emojiChanged = desiredEmoji !== (board.emoji ?? null);

      if (!nameChanged && !emojiChanged) return;

      if (
        nameChanged &&
        isDuplicateWorkspaceName(trimmedName, taskBoards, folders, {
          boardId: board.id,
        })
      ) {
        toast.error("A workspace with this name already exists");
        return;
      }

      setEditingBoardId(null);
      setOpenBoardEmojiPickerId(null);

      const updated = await clientServices.taskBoards.update({
        id: board.id,
        updates: {
          name: nameChanged ? trimmedName : board.name,
          emoji: emojiChanged ? desiredEmoji : board.emoji,
          folderId: board.folderId ?? null,
          isPublic: board.isPublic,
          createdAt: board.createdAt,
        },
      });
      if (!updated) {
        toast.error("Can't update board");
        return;
      }
      setTaskBoards((previous: TaskBoard[]) =>
        previous.map((item: TaskBoard) =>
          item.id === updated.id ? updated : item,
        ),
      );

      if (nameChanged) {
        router.push(tasksUrlHelper.routing.buildBoardUrl(updated.name));
      }
      await invalidateWorkspaceQueries(queryClient);
      toast.success(nameChanged ? "Board renamed" : "Board emoji updated");
    },
    [
      editingName,
      editingBoardEmoji,
      queryClient,
      router,
      setEditingBoardId,
      setOpenBoardEmojiPickerId,
      setTaskBoards,
      taskBoards,
      folders,
    ],
  );

  const handleDeleteConfirm = async () => {
    if (!deletingBoard) return;
    const { id, name } = deletingBoard;
    setDeletingBoard(null);
    await clientServices.taskBoards.deleteBoard(id);
    const remaining = taskBoards.filter((board: TaskBoard) => board.id !== id);
    setTaskBoards(remaining);
    router.push(
      remaining.length > 0
        ? tasksUrlHelper.routing.buildBoardUrl(remaining[0].name)
        : tasksUrlHelper.routing.buildRootUrl(),
    );
    await invalidateWorkspaceQueries(queryClient);
    toast.success(`'${name}' board deleted`);
  };

  const handleBoardAction = (taskBoard: TaskBoard, action: string) => {
    if (action === "edit") handleEditStart(taskBoard);
    if (action === "delete") setDeletingBoard(taskBoard);
  };

  const handleFolderEditStart = (folder: Folder) => {
    const folderEmoji = startFolderEdit(folder);
    setEditingFolderEmoji(folderEmoji);
    setOpenFolderEmojiPickerId(null);
  };

  const handleEditFolder = useCallback(
    async (
      folder: Folder,
      opts?: {
        emoji?: string | null;
      },
    ) => {
      const trimmedName = editingFolderName.trim();
      // `opts?.emoji === undefined` means "don't change emoji".
      // If it's `null`, that's a real "clear emoji" request.
      const desiredEmoji =
        opts?.emoji === undefined ? editingFolderEmoji : (opts?.emoji ?? null);

      const nameChanged = !!trimmedName && trimmedName !== (folder.name ?? "");
      const emojiChanged = desiredEmoji !== (folder.emoji ?? null);

      if (!nameChanged && !emojiChanged) return;

      if (
        nameChanged &&
        isDuplicateWorkspaceName(trimmedName, taskBoards, folders, {
          folderId: folder.id,
        })
      ) {
        toast.error("A workspace with this name already exists");
        return;
      }

      setEditingFolderId(null);
      setOpenFolderEmojiPickerId(null);

      const updated = await clientServices.folders.update({
        id: folder.id,
        updates: {
          name: nameChanged ? trimmedName : folder.name,
          emoji: emojiChanged ? desiredEmoji : folder.emoji,
          isPublic: folder.isPublic,
          createdAt: folder.createdAt,
        },
      });
      if (!updated) {
        toast.error("Can't update folder");
        return;
      }

      setFolders((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item)),
      );

      await invalidateWorkspaceQueries(queryClient);
      toast.success(nameChanged ? "Folder renamed" : "Folder emoji updated");
    },
    [
      editingFolderEmoji,
      editingFolderName,
      queryClient,
      setEditingFolderId,
      setOpenFolderEmojiPickerId,
      setFolders,
      folders,
      taskBoards,
    ],
  );

  const handleFolderAction = (folder: Folder, action: string) => {
    if (action === "edit") handleFolderEditStart(folder);
    if (action === "delete") setDeletingFolder(folder);
  };

  const handleFolderDeleteConfirm = async () => {
    if (!deletingFolder) return;
    const folder = deletingFolder;
    setDeletingFolder(null);
    await clientServices.folders.deleteFolder(folder.id);
    setFolders((prev) => prev.filter((f) => f.id !== folder.id));
    setTaskBoards((prev) =>
      prev.map((b) =>
        b.folderId === folder.id ? { ...b, folderId: undefined } : b,
      ),
    );
    await invalidateWorkspaceQueries(queryClient);
    toast.success("Folder deleted");
  };

  const handleBoardDragStart = (e: React.DragEvent, taskBoard: TaskBoard) => {
    if ((e.target as HTMLElement).closest("[data-board-actions-trigger]"))
      return;
    // Some browsers (notably Safari) won't start a drag without a text/plain payload.
    e.dataTransfer.setData("text/plain", taskBoard.id);
    e.dataTransfer.setData(DRAG_BOARD_KEY, taskBoard.id);
    e.dataTransfer.setData(
      DRAG_REORDER_BOARD_KEY,
      JSON.stringify({
        boardId: taskBoard.id,
        folderId: taskBoard.folderId ?? null,
      }),
    );
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOn = useCallback(
    (targetFolderId: string) => (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverTarget(null);
      const boardId = e.dataTransfer.getData(DRAG_BOARD_KEY);
      if (!boardId) return;
      const folderId = isRootDrop(targetFolderId) ? null : targetFolderId;
      const board = taskBoards.find((b) => b.id === boardId);
      if (!board) return;
      if ((board.folderId ?? null) === folderId) return;

      void clientServices.taskBoards
        .update({
          id: boardId,
          updates: {
            name: board.name,
            emoji: board.emoji,
            folderId,
            isPublic: board.isPublic,
            createdAt: board.createdAt,
          },
        })
        .then(async (updated) => {
          if (!updated) {
            toast.error("Can't move board");
            return;
          }
          setTaskBoards((previous) =>
            previous.map((item) => (item.id === updated.id ? updated : item)),
          );
          await invalidateWorkspaceQueries(queryClient);
          if (folderId && expandedFolder !== folderId)
            setExpandedFolder(folderId);
          toast.success("Board moved");
        });
    },
    [expandedFolder, queryClient, setTaskBoards, taskBoards],
  );

  const handleBoardReorderDragOver = (event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes(DRAG_REORDER_BOARD_KEY)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
  };

  const handleBoardReorderDrop = (
    event: React.DragEvent,
    targetBoard: TaskBoard,
    folderScope: string | null,
  ) => {
    const raw = event.dataTransfer.getData(DRAG_REORDER_BOARD_KEY);
    if (!raw) return;
    event.preventDefault();
    event.stopPropagation();
    setDragOverTarget(null);
    let payload: { boardId: string; folderId: string | null };
    try {
      payload = JSON.parse(raw) as { boardId: string; folderId: string | null };
    } catch {
      return;
    }
    const targetFolderId = targetBoard.folderId ?? null;
    if (payload.folderId !== targetFolderId) return;
    if (payload.boardId === targetBoard.id) return;
    if (folderScope === null) reorderRootBoard(payload.boardId, targetBoard.id);
    else reorderBoardInFolder(folderScope, payload.boardId, targetBoard.id);
  };

  const handleFolderReorderDragOver =
    (targetFolderId: string) => (event: React.DragEvent) => {
      if (!event.dataTransfer.types.includes(DRAG_REORDER_FOLDER_KEY)) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "move";
      setDragOverTarget(targetFolderId);
    };

  return {
    activeView,
    expandedFolder,
    setExpandedFolder,
    openMenuBoardId,
    setOpenMenuBoardId,
    dragOverTarget,
    setDragOverTarget,
    openMenuFolderId,
    setOpenMenuFolderId,
    editingBoardId,
    setEditingBoardId,
    editingName,
    setEditingName,
    editingFolderId,
    setEditingFolderId,
    editingFolderName,
    setEditingFolderName,
    deletingBoard,
    setDeletingBoard,
    deletingFolder,
    setDeletingFolder,
    editingBoardEmoji,
    setEditingBoardEmoji,
    openBoardEmojiPickerId,
    setOpenBoardEmojiPickerId,
    editingFolderEmoji,
    setEditingFolderEmoji,
    openFolderEmojiPickerId,
    setOpenFolderEmojiPickerId,
    sortedFolders,
    rootBoardsSorted,
    boardsInFolderSorted,
    reorderFolder,
    handleViewChange,
    toggleFolder,
    handleEditBoard,
    handleDeleteConfirm,
    handleBoardAction,
    handleEditFolder,
    handleFolderAction,
    handleFolderDeleteConfirm,
    handleBoardDragStart,
    handleDropOn,
    handleBoardReorderDragOver,
    handleBoardReorderDrop,
    handleFolderReorderDragOver,
  };
}

export type TasksSidebarModel = ReturnType<typeof useTasksSidebarModel>;
