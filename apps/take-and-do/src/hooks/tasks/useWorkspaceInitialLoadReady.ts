"use client";

import { useEffect, useState } from "react";

import { useWorkspaceRepository } from "@/repositories/workspace";

export function useWorkspaceInitialLoadReady(): boolean {
  const { isBoardsLoading, isFoldersLoading } = useWorkspaceRepository();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isBoardsLoading && !isFoldersLoading) setIsReady(true);
  }, [isBoardsLoading, isFoldersLoading]);

  return isReady;
}
