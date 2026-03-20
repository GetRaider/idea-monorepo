"use client";

import { useState } from "react";
import { Folder, TaskBoard } from "@/types/workspace";

export function useSidebarDeleteState() {
  const [deletingBoard, setDeletingBoard] = useState<TaskBoard | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);

  return {
    deletingBoard,
    setDeletingBoard,
    deletingFolder,
    setDeletingFolder,
  };
}
