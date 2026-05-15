import type { ReactNode, Ref } from "react";

import { CollapsibleSidePanelMain } from "@/components/Panel";

export interface CalendarPlannerMainColumnProps {
  calendarSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  calendarScopeRef: Ref<HTMLDivElement | null>;
  children: ReactNode;
}

export function CalendarPlannerMainColumn({
  calendarSidebarCollapsed,
  onToggleSidebar,
  calendarScopeRef,
  children,
}: CalendarPlannerMainColumnProps) {
  return (
    <CollapsibleSidePanelMain
      collapsed={calendarSidebarCollapsed}
      onRequestExpand={onToggleSidebar}
      panelId="calendar-planner-sidebar"
      showTooltip="Show Panel"
      showSrLabel="Show calendar sidebar"
      rootRef={calendarScopeRef}
      rootClassName="relative flex min-h-0 flex-1 overflow-visible"
    >
      {children}
    </CollapsibleSidePanelMain>
  );
}
