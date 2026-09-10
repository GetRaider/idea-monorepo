"use client";

import type { ReactNode } from "react";

import { TaskEditor } from "./task-editor";
import { TasksModuleSidebar } from "./module-sidebar";
import { SpaceDialogsProvider } from "./space-dialogs";
import { TasksProvider } from "./tasks-provider";

export default function TasksLayout({ children }: { children: ReactNode }) {
  return (
    <TasksProvider>
      <SpaceDialogsProvider>
        <div className="flex h-screen min-h-0 overflow-hidden">
          <TasksModuleSidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
          <TaskEditor />
        </div>
      </SpaceDialogsProvider>
    </TasksProvider>
  );
}
