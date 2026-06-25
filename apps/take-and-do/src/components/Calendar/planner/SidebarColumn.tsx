import type { ReactNode, Ref } from "react";

import { SidePanel } from "@/components/SidePanel";
import { cn } from "@/lib/styles/utils";

import { CalendarPanel, type CalendarPanelProps } from "../shell/Panel";

export interface CalendarPlannerSidebarColumnProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  panelProps: CalendarPanelProps;
  calendarScopeRef: Ref<HTMLDivElement | null>;
  children: ReactNode;
}

export function CalendarPlannerSidebarColumn({
  collapsed,
  onToggleCollapse,
  panelProps,
  calendarScopeRef,
  children,
}: CalendarPlannerSidebarColumnProps) {
  return (
    <SidePanel
      expanded={!collapsed}
      onRequestCollapse={onToggleCollapse}
      onExpand={onToggleCollapse}
      panelId="calendar-planner-sidebar"
      hideTooltip="Hide Panel"
      hideSrLabel="Hide calendar sidebar"
      showTooltip="Show Panel"
      showSrLabel="Show calendar sidebar"
      sidebarColumnClassName={cn(
        "relative flex w-full shrink-0 flex-col overflow-visible transition-[width,opacity,min-width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] max-lg:opacity-100 motion-reduce:transition-none lg:min-h-0 lg:max-h-full lg:self-stretch",
        collapsed
          ? "lg:pointer-events-none lg:w-0 lg:min-w-0 lg:opacity-0"
          : "lg:w-[260px] lg:opacity-100",
      )}
      sidebarContentClassName="relative flex min-h-0 w-full min-w-[260px] max-w-[260px] flex-1 flex-col overflow-hidden max-lg:min-h-0 max-lg:max-w-none max-lg:flex-none lg:min-h-0 lg:max-h-full"
      sidebarContentId="calendar-planner-sidebar"
      sidebar={<CalendarPanel {...panelProps} />}
      mainRef={calendarScopeRef}
      mainClassName="relative flex min-h-0 flex-1 overflow-visible"
    >
      {children}
    </SidePanel>
  );
}
