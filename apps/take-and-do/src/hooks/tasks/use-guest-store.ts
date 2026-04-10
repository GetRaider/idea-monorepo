"use client";

import { useCallback, useEffect, useState } from "react";

import { Task, TaskUpdate } from "@/components/Boards/KanbanBoard/types";
import { GUEST_STORE_UPDATED_EVENT } from "@/stores/guest/constants";
import { guestStoreHelper } from "@/stores/guest";

export function useGuestTasks() {
  const [tasks, setTasks] = useState<Task[]>(() =>
    typeof window === "undefined" ? [] : guestStoreHelper.getTasks(),
  );

  useEffect(() => {
    setTasks(guestStoreHelper.getTasks());
    const handler = () => setTasks(guestStoreHelper.getTasks());
    window.addEventListener(GUEST_STORE_UPDATED_EVENT, handler);
    return () => window.removeEventListener(GUEST_STORE_UPDATED_EVENT, handler);
  }, []);

  const add = useCallback((task: Omit<Task, "id">) => {
    return guestStoreHelper.addTask(task);
  }, []);

  const update = useCallback((id: string, patch: TaskUpdate) => {
    return guestStoreHelper.updateTask(id, patch);
  }, []);

  const remove = useCallback((id: string) => {
    guestStoreHelper.deleteTask(id);
  }, []);

  return { tasks, add, update, remove };
}
