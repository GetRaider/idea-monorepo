"use client";

import type { ReactNode } from "react";

import { CanvasColumn } from "@components/CanvasColumn";
import { ModuleSurface } from "@components/module-surface";

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
          <ModuleSurface>
            <TasksModuleSidebar />
            <CanvasColumn>
              <div className="flex min-h-0 min-w-0 flex-1">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  {children}
                </div>
                <TaskView />
              </div>
            </CanvasColumn>
          </ModuleSurface>
        </BoardPreferencesProvider>
      </SpaceDialogsProvider>
    </TasksProvider>
  );
}
