"use client";

import type { ReactNode } from "react";

import { TasksMainWorkArea } from "./TasksMainWorkArea";

type TasksSubpageShellProps = {
  children: ReactNode;
};

export function TasksSubpageShell({ children }: TasksSubpageShellProps) {
  return (
    <div className="box-border flex w-full min-h-0 flex-1 flex-col">
      <TasksMainWorkArea>{children}</TasksMainWorkArea>
    </div>
  );
}
