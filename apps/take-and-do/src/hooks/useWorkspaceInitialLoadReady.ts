"use client";

import { useEffect, useState } from "react";

import { useWorkspace } from "@/contexts/WorkspaceContext";

export function useWorkspaceInitialLoadReady(): boolean {
  const { isBoardsLoading, isFoldersLoading } = useWorkspace();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isBoardsLoading && !isFoldersLoading) setIsReady(true);
  }, [isBoardsLoading, isFoldersLoading]);

  return isReady;
}
