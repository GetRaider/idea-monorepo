import { cn } from "@/lib/styles/utils";
import { CollapsibleSidePanel } from "@/components/Panel";

import { CalendarPanel, type CalendarPanelProps } from "../shell/Panel";

export interface CalendarPlannerSidebarColumnProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  panelProps: CalendarPanelProps;
}

export function CalendarPlannerSidebarColumn({
  collapsed,
  onToggleCollapse,
  panelProps,
}: CalendarPlannerSidebarColumnProps) {
  return (
    <CollapsibleSidePanel
      expanded={!collapsed}
      onRequestCollapse={onToggleCollapse}
      panelId="calendar-planner-sidebar"
      hideTooltip="Hide Panel"
      hideSrLabel="Hide calendar sidebar"
      columnClassName={cn(
        "relative flex w-full shrink-0 flex-col overflow-visible transition-[width,opacity,min-width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] max-lg:opacity-100 motion-reduce:transition-none lg:min-h-0 lg:max-h-full lg:self-stretch",
        collapsed
          ? "lg:pointer-events-none lg:w-0 lg:min-w-0 lg:opacity-0"
          : "lg:w-[260px] lg:opacity-100",
      )}
      contentClassName="relative flex min-h-0 w-full min-w-[260px] max-w-[260px] flex-1 flex-col overflow-hidden max-lg:min-h-0 max-lg:max-w-none max-lg:flex-none lg:min-h-0 lg:max-h-full"
      contentId="calendar-planner-sidebar"
    >
      <CalendarPanel {...panelProps} />
    </CollapsibleSidePanel>
  );
}
