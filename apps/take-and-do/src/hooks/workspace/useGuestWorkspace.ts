"use client";

import { useCallback, useEffect, useState } from "react";

import { Task, TaskUpdate } from "@/components/Boards/KanbanBoard/types";
import { GUEST_STORE_UPDATED_EVENT } from "@/stores/guest/constants";
import { guestStoreHelper } from "@/stores/guest";
import type { Folder, TaskBoard } from "@/types/workspace";

export function useGuestWorkspace(): UseGuestWorkspaceReturn {
  const [tasks, setTasks] = useState<Task[]>(() =>
    typeof window === "undefined" ? [] : guestStoreHelper.getTasks(),
  );
  const [folders, setFolders] = useState<Folder[]>(() =>
    typeof window === "undefined" ? [] : guestStoreHelper.getFolders(),
  );
  const [taskBoards, setTaskBoards] = useState<TaskBoard[]>(() =>
    typeof window === "undefined" ? [] : guestStoreHelper.getTaskBoards(),
  );

  useEffect(() => {
    const sync = () => {
      setTasks(guestStoreHelper.getTasks());
      setFolders(guestStoreHelper.getFolders());
      setTaskBoards(guestStoreHelper.getTaskBoards());
    };

    sync();
    window.addEventListener(GUEST_STORE_UPDATED_EVENT, sync);
    return () => window.removeEventListener(GUEST_STORE_UPDATED_EVENT, sync);
  }, []);

  const addTask = useCallback((task: Omit<Task, "id">) => {
    return guestStoreHelper.addTask(task);
  }, []);

  const updateTask = useCallback((taskId: string, patch: TaskUpdate) => {
    return guestStoreHelper.updateTask(taskId, patch);
  }, []);

  const removeTask = useCallback((taskId: string) => {
    guestStoreHelper.deleteTask(taskId);
  }, []);

  return {
    tasks,
    folders,
    taskBoards,
    addTask,
    updateTask,
    removeTask,
  };
}

interface UseGuestWorkspaceReturn {
  tasks: Task[];
  folders: Folder[];
  taskBoards: TaskBoard[];
  addTask: (task: Omit<Task, "id">) => Task;
  updateTask: (taskId: string, patch: TaskUpdate) => Task | null;
  removeTask: (taskId: string) => void;
}
