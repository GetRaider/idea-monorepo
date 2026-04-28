"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { TasksSidebarProps } from "@/components/TasksSidebar/tasksSidebar.types";
import { useTasksSidebarOrder } from "@/hooks/tasks/useTasksSidebarOrder";
import { isDuplicateWorkspaceName } from "@/helpers/workspace-name.helper";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { invalidateWorkspaceQueries } from "@/lib/invalidate-app-queries";
import {
  type DragEndEvent,
  type DragOverEvent,
  type SidebarDraggableData,
  type SidebarDroppableData,
} from "@/lib/board-dnd";
import { clientServices } from "@/services";
import type { Folder, TaskBoard } from "@/types/workspace";

import { useEmojiPickerState } from "./useEmojiPickerState";
import { useSidebarDeleteState } from "./useSidebarDeleteState";
import { useSidebarEditingState } from "./useSidebarEditingState";

/** Live drop feedback for workspace list DnD. */
export type SidebarDragHighlight =
  | null
  | { kind: "root-surface" }
  | { kind: "folder"; folderId: string }
  | {
      kind: "before-board";
      targetBoardId: string;
      folderScope: string | null;
    }
  | { kind: "top-insert"; beforeId: string | null };

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
  const [sidebarDragHighlight, setSidebarDragHighlight] =
    useState<SidebarDragHighlight>(null);
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
    sortedTopLevelRows,
    boardsInFolderSorted,
    reorderTopLevel,
    reorderBoardInFolder,
    removeFromTopLevel,
    insertRootBoardTopLevel,
    moveTopLevelToEnd,
  } = useTasksSidebarOrder(folders, taskBoards);

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

  const moveBoardToFolder = useCallback(
    (
      boardId: string,
      folderId: string | null,
      rootInsertBeforeId?: string | null,
    ) => {
      const board = taskBoards.find((b) => b.id === boardId);
      if (!board) return;
      if ((board.folderId ?? null) === folderId) {
        if (folderId == null && rootInsertBeforeId !== undefined) {
          insertRootBoardTopLevel(boardId, rootInsertBeforeId);
        }
        return;
      }

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
          const wasRoot = !board.folderId;
          setTaskBoards((previous) =>
            previous.map((item) => (item.id === updated.id ? updated : item)),
          );
          if (!updated.folderId) {
            insertRootBoardTopLevel(boardId, rootInsertBeforeId ?? null);
          } else if (wasRoot) {
            removeFromTopLevel(boardId);
          }
          await invalidateWorkspaceQueries(queryClient);
          if (folderId && expandedFolder !== folderId)
            setExpandedFolder(folderId);
          toast.success("Board moved");
        });
    },
    [
      expandedFolder,
      insertRootBoardTopLevel,
      queryClient,
      removeFromTopLevel,
      setTaskBoards,
      taskBoards,
    ],
  );

  const handleSidebarDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setSidebarDragHighlight(null);
      return;
    }
    const activeData = active.data.current as SidebarDraggableData | undefined;
    const overData = over.data.current as SidebarDroppableData | undefined;
    if (!overData) {
      setSidebarDragHighlight(null);
      return;
    }

    if (activeData?.type === "sidebar-folder") {
      if (
        overData.type === "sidebar-top-insert" ||
        overData.type === "sidebar-top-insert-end"
      ) {
        setSidebarDragHighlight({
          kind: "top-insert",
          beforeId:
            overData.type === "sidebar-top-insert-end"
              ? null
              : overData.beforeId,
        });
        return;
      }
      if (overData.type === "sidebar-folder-target") {
        setSidebarDragHighlight({
          kind: "folder",
          folderId: overData.folderId,
        });
      } else {
        setSidebarDragHighlight(null);
      }
      return;
    }

    if (overData.type === "sidebar-top-insert") {
      setSidebarDragHighlight({
        kind: "top-insert",
        beforeId: overData.beforeId,
      });
      return;
    }
    if (overData.type === "sidebar-top-insert-end") {
      setSidebarDragHighlight({ kind: "top-insert", beforeId: null });
      return;
    }

    if (overData.type === "sidebar-root") {
      setSidebarDragHighlight({ kind: "root-surface" });
      return;
    }
    if (overData.type === "sidebar-folder-target") {
      setSidebarDragHighlight({ kind: "folder", folderId: overData.folderId });
      return;
    }
    if (overData.type === "sidebar-board-insert") {
      setSidebarDragHighlight({
        kind: "before-board",
        targetBoardId: overData.targetBoardId,
        folderScope: overData.folderScope,
      });
      return;
    }

    setSidebarDragHighlight(null);
  }, []);

  const handleSidebarDragCancel = useCallback(() => {
    setSidebarDragHighlight(null);
  }, []);

  const handleSidebarDragEnd = useCallback(
    (event: DragEndEvent) => {
      setSidebarDragHighlight(null);
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current as
        | SidebarDraggableData
        | undefined;
      const overData = over.data.current as SidebarDroppableData | undefined;
      if (!activeData || !overData) return;

      if (activeData.type === "sidebar-folder") {
        if (overData.type === "sidebar-top-insert") {
          if (activeData.folderId !== overData.beforeId) {
            reorderTopLevel(activeData.folderId, overData.beforeId);
          }
          return;
        }
        if (overData.type === "sidebar-top-insert-end") {
          moveTopLevelToEnd(activeData.folderId);
          return;
        }
        if (overData.type === "sidebar-folder-target") {
          if (activeData.folderId === overData.folderId) return;
          reorderTopLevel(activeData.folderId, overData.folderId);
        }
        return;
      }

      if (activeData.type !== "sidebar-board") return;

      const { boardId, folderId: sourceFolderId } = activeData;

      if (overData.type === "sidebar-root") {
        moveBoardToFolder(boardId, null);
        return;
      }

      if (overData.type === "sidebar-folder-target") {
        moveBoardToFolder(boardId, overData.folderId);
        return;
      }

      if (overData.type === "sidebar-top-insert") {
        const { beforeId } = overData;
        if (sourceFolderId == null) {
          if (boardId === beforeId) return;
          reorderTopLevel(boardId, beforeId);
          return;
        }
        moveBoardToFolder(boardId, null, beforeId);
        return;
      }

      if (overData.type === "sidebar-top-insert-end") {
        if (sourceFolderId == null) {
          moveTopLevelToEnd(boardId);
          return;
        }
        moveBoardToFolder(boardId, null, null);
        return;
      }

      if (overData.type === "sidebar-board-insert") {
        const targetBoard = taskBoards.find(
          (b) => b.id === overData.targetBoardId,
        );
        if (!targetBoard) return;
        const targetFolderId = targetBoard.folderId ?? null;
        if (sourceFolderId !== targetFolderId) return;
        if (boardId === overData.targetBoardId) return;
        if (overData.folderScope === null) {
          reorderTopLevel(boardId, overData.targetBoardId);
        } else {
          reorderBoardInFolder(
            overData.folderScope,
            boardId,
            overData.targetBoardId,
          );
        }
      }
    },
    [
      moveBoardToFolder,
      moveTopLevelToEnd,
      reorderBoardInFolder,
      reorderTopLevel,
      taskBoards,
    ],
  );

  return {
    activeView,
    expandedFolder,
    setExpandedFolder,
    openMenuBoardId,
    setOpenMenuBoardId,
    sidebarDragHighlight,
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
    sortedTopLevelRows,
    boardsInFolderSorted,
    folders,
    taskBoards,
    handleViewChange,
    toggleFolder,
    handleEditBoard,
    handleDeleteConfirm,
    handleBoardAction,
    handleEditFolder,
    handleFolderAction,
    handleFolderDeleteConfirm,
    handleSidebarDragEnd,
    handleSidebarDragOver,
    handleSidebarDragCancel,
  };
}

export type TasksSidebarModel = ReturnType<typeof useTasksSidebarModel>;
