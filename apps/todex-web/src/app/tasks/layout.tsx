"use client";

import type { ReactNode } from "react";

import { CanvasColumn } from "@components/CanvasColumn";

import { BoardPreferencesProvider } from "./board-preferences-provider";
import { TaskView } from "./task-view";
import { TasksModuleSidebar } from "./module-sidebar";
import { SpaceDialogsProvider } from "./space-dialogs";
import { TasksProvider } from "./tasks-provider";

export default function TasksLayout({ children }: { children: ReactNode }) {
  return (
    <TasksProvider>
      <SpaceDialogsProvider>
        <BoardPreferencesProvider>
          <div className="my-2 mr-2 flex w-full min-w-0 overflow-hidden rounded-xl border border-border bg-sidebar">
            <TasksModuleSidebar />
            <CanvasColumn>
              {children}
              <TaskView />
            </CanvasColumn>
          </div>
        </BoardPreferencesProvider>
      </SpaceDialogsProvider>
    </TasksProvider>
  );
}
