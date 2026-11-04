"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

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
            <PlanningCanvas>{children}</PlanningCanvas>
          </ModuleSurface>
        </BoardPreferencesProvider>
      </SpaceDialogsProvider>
    </TasksProvider>
  );
}

function PlanningCanvas({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const calendar = pathname.startsWith("/planning/calendar");

  return (
    <CanvasColumn>
      <div className="flex min-h-0 min-w-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
        {calendar ? null : <TaskView />}
      </div>
    </CanvasColumn>
  );
}
