"use client";

import { useState } from "react";

import { ClockCircleIcon, ClockNavIcon } from "@/components/Icons";
import { cn } from "@/lib/styles/utils";

import {
  SidebarCollapsibleSectionHeader,
  WorkspaceList,
  WorkspaceItem,
  WorkspaceToggle,
  SidebarChevronGutter,
  WorkspaceContainer,
} from "./TasksSidebar.ui";
import { SidebarTreeIconSlot } from "./SidebarTreeIconSlot";

import type { TasksSidebarModel } from "@/hooks/tasksSidebar/useTasksSidebarModel";

type TasksSidebarSchedulesSectionProps = {
  model: TasksSidebarModel;
};

export function TasksSidebarSchedulesSection({
  model,
}: TasksSidebarSchedulesSectionProps) {
  const { activeView, handleViewChange } = model;
  const [sectionOpen, setSectionOpen] = useState(true);

  return (
    <WorkspaceContainer>
      <SidebarCollapsibleSectionHeader
        isExpanded={sectionOpen}
        onToggle={() => setSectionOpen((o) => !o)}
        title="Schedules"
      />

      {sectionOpen ? (
        <WorkspaceList className="min-h-0 flex-none">
          <WorkspaceItem>
            <WorkspaceToggle
              type="button"
              className={cn(
                activeView === "today" &&
                  "cursor-default bg-[#2a2a2a] text-white hover:bg-[#2a2a2a] hover:text-white",
              )}
              onClick={() =>
                activeView !== "today" && handleViewChange("today")
              }
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
                  "cursor-default bg-[#2a2a2a] text-white hover:bg-[#2a2a2a] hover:text-white",
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
      ) : null}
    </WorkspaceContainer>
  );
}
