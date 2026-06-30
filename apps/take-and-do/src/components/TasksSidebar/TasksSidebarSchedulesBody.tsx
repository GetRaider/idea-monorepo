"use client";

import { ClockCircleIcon, ClockNavIcon } from "@/components/Icons";
import { cn } from "@/lib/styles/utils";

import {
  WorkspaceList,
  WorkspaceItem,
  WorkspaceToggle,
  SidebarChevronGutter,
} from "./TasksSidebar.ui";
import { SidebarTreeIconSlot } from "./SidebarTreeIconSlot";

import type { TasksSidebarModel } from "@/hooks/tasksSidebar/useTasksSidebarModel";

type TasksSidebarSchedulesBodyProps = {
  model: TasksSidebarModel;
};

export function TasksSidebarSchedulesBody({
  model,
}: TasksSidebarSchedulesBodyProps) {
  const { activeView, handleViewChange } = model;

  return (
    <WorkspaceList className="min-h-0 flex-none">
      <WorkspaceItem>
        <WorkspaceToggle
          type="button"
          className={cn(
            activeView === "today" &&
              "cursor-default bg-surface-active text-text-primary hover:bg-surface-active hover:text-text-primary",
          )}
          onClick={() => activeView !== "today" && handleViewChange("today")}
        >
          <SidebarChevronGutter />
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <SidebarTreeIconSlot>
              <ClockNavIcon size={20} />
            </SidebarTreeIconSlot>
            <span className="min-w-0 truncate leading-5">Today</span>
          </span>
        </WorkspaceToggle>
      </WorkspaceItem>

      <WorkspaceItem>
        <WorkspaceToggle
          type="button"
          className={cn(
            activeView === "tomorrow" &&
              "cursor-default bg-surface-active text-text-primary hover:bg-surface-active hover:text-text-primary",
          )}
          onClick={() =>
            activeView !== "tomorrow" && handleViewChange("tomorrow")
          }
        >
          <SidebarChevronGutter />
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            <SidebarTreeIconSlot>
              <ClockCircleIcon size={20} />
            </SidebarTreeIconSlot>
            <span className="min-w-0 truncate leading-5">Tomorrow</span>
          </span>
        </WorkspaceToggle>
      </WorkspaceItem>
    </WorkspaceList>
  );
}
