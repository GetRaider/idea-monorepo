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
          <div className="mb-2 mr-2 flex w-full min-w-0 overflow-hidden rounded-xl border border-border bg-sidebar">
            <TasksModuleSidebar />
            <CanvasColumn>
              <div className="flex min-h-0 min-w-0 flex-1">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  {children}
                </div>
                <TaskView />
              </div>
            </CanvasColumn>
          </div>
        </BoardPreferencesProvider>
      </SpaceDialogsProvider>
    </TasksProvider>
  );
}
