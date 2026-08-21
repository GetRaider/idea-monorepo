"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { GuestImportDialog } from "@/components/GuestImportDialog";
import { useUser } from "@/contexts/UserContext";
import {
  guestStoreHasImportableData,
  importGuestStore,
} from "@/helpers/guest-import.helper";
import { useWorkspaceRepository } from "@/repositories/workspace";
import { guestStoreHelper } from "@/stores/guest";
import type { GuestStore } from "@/stores/guest/types";

function countGuestTasks(tasks: GuestStore["tasks"]): number {
  let total = 0;

  const walk = (task: GuestStore["tasks"][number]) => {
    total += 1;
    task.subtasks?.forEach(walk);
  };

  tasks.forEach(walk);
  return total;
}

export function GuestImportOnSignIn() {
  const { isGuest, isPending, userId } = useUser();
  const {
    createFolder,
    createTaskBoard,
    createTask,
    createSubtask,
    afterMutation,
  } = useWorkspaceRepository();
  const handledUserIdRef = useRef<string | null>(null);
  const [pendingStore, setPendingStore] = useState<GuestStore | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (isPending || isGuest || !userId) return;
    if (handledUserIdRef.current === userId) return;

    const store = guestStoreHelper.read();
    if (!guestStoreHasImportableData(store)) {
      handledUserIdRef.current = userId;
      return;
    }

    setPendingStore(store);
  }, [isGuest, isPending, userId]);

  const finishImportFlow = useCallback(() => {
    guestStoreHelper.clear();
    setPendingStore(null);
    if (userId) handledUserIdRef.current = userId;
  }, [userId]);

  const handleDiscard = useCallback(() => {
    finishImportFlow();
  }, [finishImportFlow]);

  const handleImport = useCallback(async () => {
    if (!pendingStore) return;
    setIsImporting(true);
    try {
      const summary = await importGuestStore(pendingStore, {
        createFolder,
        createTaskBoard,
        createTask,
        createSubtask,
      });
      await afterMutation();
      finishImportFlow();
      toast.success(
        `Imported ${summary.tasksCreated} task${summary.tasksCreated === 1 ? "" : "s"}`,
      );
    } finally {
      setIsImporting(false);
    }
  }, [
    afterMutation,
    createFolder,
    createSubtask,
    createTask,
    createTaskBoard,
    finishImportFlow,
    pendingStore,
  ]);

  if (!pendingStore) return null;

  return (
    <GuestImportDialog
      folderCount={pendingStore.folders.length}
      boardCount={pendingStore.taskBoards.length}
      taskCount={countGuestTasks(pendingStore.tasks)}
      isImporting={isImporting}
      onImport={handleImport}
      onDiscard={handleDiscard}
      onClose={handleDiscard}
    />
  );
}
