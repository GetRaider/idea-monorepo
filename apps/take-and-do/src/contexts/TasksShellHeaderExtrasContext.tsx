"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type TasksShellHeaderExtrasValue = {
  settingsSlot: ReactNode | null;
  setSettingsSlot: Dispatch<SetStateAction<ReactNode | null>>;
};

const TasksShellHeaderExtrasContext =
  createContext<TasksShellHeaderExtrasValue | null>(null);

export function TasksShellHeaderExtrasProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [settingsSlot, setSettingsSlot] = useState<ReactNode | null>(null);
  const value = useMemo(
    () => ({ settingsSlot, setSettingsSlot }),
    [settingsSlot],
  );
  return (
    <TasksShellHeaderExtrasContext.Provider value={value}>
      {children}
    </TasksShellHeaderExtrasContext.Provider>
  );
}

export function useTasksShellHeaderExtras(): TasksShellHeaderExtrasValue {
  const ctx = useContext(TasksShellHeaderExtrasContext);
  if (!ctx) {
    return {
      settingsSlot: null,
      setSettingsSlot: () => {},
    };
  }
  return ctx;
}
