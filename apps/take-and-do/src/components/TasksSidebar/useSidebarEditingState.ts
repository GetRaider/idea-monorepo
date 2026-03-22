"use client";

import { useState } from "react";
import { Folder, TaskBoard } from "@/types/workspace";

export function useSidebarEditingState() {
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  const startBoardEdit = (board: TaskBoard, boardEmoji?: string | null) => {
    setEditingName(board.name);
    setEditingBoardId(board.id);
    if (boardEmoji !== undefined) return boardEmoji;
    return board.emoji ?? null;
  };

  const startFolderEdit = (folder: Folder, folderEmoji?: string | null) => {
    setEditingFolderName(folder.name);
    setEditingFolderId(folder.id);
    if (folderEmoji !== undefined) return folderEmoji;
    return folder.emoji ?? null;
  };

  const stopBoardEdit = () => setEditingBoardId(null);
  const stopFolderEdit = () => setEditingFolderId(null);

  return {
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
    stopBoardEdit,
    stopFolderEdit,
  };
}
