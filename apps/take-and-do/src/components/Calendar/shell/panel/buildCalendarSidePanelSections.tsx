"use client";

import type { SidePanelSection } from "@/components/SidePanel/SidePanel.types";
import type { Task } from "@/types/task";
import type {
  CalendarBacklogEvent,
  CalendarEventType,
  CalendarKindVisibility,
} from "@/types/calendar.types";

import { CalendarPanelBacklogBody } from "./CalendarPanelBacklogBody";
import { CalendarPanelCalendarsBody } from "./CalendarPanelCalendarsBody";
import { CalendarPanelEventTypesBody } from "./CalendarPanelEventTypesBody";
import { CalendarPanelMonthBody } from "./CalendarPanelMonthBody";
import { CalendarPanelMonthHeaderActions } from "./CalendarPanelMonthHeaderActions";
import { CalendarPanelTasksBody } from "./CalendarPanelTasksBody";
import { CAL_PANEL_DEFAULT_OPEN } from "./calendar-panel.constants";

export function buildCalendarSidePanelSections(
  context: CalendarSidePanelSectionsContext,
): SidePanelSection[] {
  return [
    {
      id: "month",
      title: "Month",
      defaultOpen: CAL_PANEL_DEFAULT_OPEN.month,
      headerActions: (
        <CalendarPanelMonthHeaderActions
          monthTitle={context.monthTitle}
          onPreviousMonth={context.onPreviousMonth}
          onNextMonth={context.onNextMonth}
        />
      ),
      body: (
        <CalendarPanelMonthBody
          rows={context.rows}
          selectedDay={context.selectedDay}
          onSelectDay={context.onSelectDay}
          onPickCalendarDay={context.onPickCalendarDay}
        />
      ),
    },
    {
      id: "calendars",
      title: "Calendars",
      defaultOpen: CAL_PANEL_DEFAULT_OPEN.calendars,
      showTopBorder: true,
      body: (
        <CalendarPanelCalendarsBody
          showInternalCalendar={context.showInternalCalendar}
          onShowInternalCalendarChange={context.onShowInternalCalendarChange}
          showGoogleCalendar={context.showGoogleCalendar}
          onShowGoogleCalendarChange={context.onShowGoogleCalendarChange}
          googleCalendarLabel={context.googleCalendarLabel}
          internalCalendarColor={context.internalCalendarColor}
          googleCalendarColor={context.googleCalendarColor}
          onInternalCalendarColorChange={context.onInternalCalendarColorChange}
          onGoogleCalendarColorChange={context.onGoogleCalendarColorChange}
        />
      ),
    },
    {
      id: "tasks",
      title: "Tasks",
      defaultOpen: CAL_PANEL_DEFAULT_OPEN.tasks,
      showTopBorder: true,
      body: (
        <CalendarPanelTasksBody
          boardOptions={context.boardOptions}
          selectedBoardId={context.selectedBoardId}
          onSelectedBoardIdChange={context.onSelectedBoardIdChange}
          isBoardsLoading={context.isBoardsLoading}
          tasksLoading={context.tasksLoading}
          sortedBoardTasks={context.sortedBoardTasks}
          boardTasksCount={context.boardTasksCount}
        />
      ),
    },
    {
      id: "eventTypes",
      title: "Event Types",
      defaultOpen: CAL_PANEL_DEFAULT_OPEN.eventTypes,
      showTopBorder: true,
      actions: [
        {
          type: "info",
          tooltip: "Filter which event types show on the calendar.",
        },
      ],
      body: (
        <CalendarPanelEventTypesBody
          kindVisibility={context.kindVisibility}
          allKindsOn={context.allKindsOn}
          onKindVisibilityChange={context.onKindVisibilityChange}
          onToggleKind={context.onToggleKind}
        />
      ),
    },
    {
      id: "backlog",
      title: "Events Backlog",
      defaultOpen: CAL_PANEL_DEFAULT_OPEN.backlog,
      showTopBorder: true,
      grow: true,
      actions: [
        {
          type: "info",
          tooltip: "Reusable backlog events",
        },
        {
          type: "add",
          label: "Add backlog template",
          title: "Add backlog template",
          onClick: context.onRequestNewTemplate,
        },
      ],
      body: (
        <CalendarPanelBacklogBody
          items={context.items}
          internalCalendarColor={context.internalCalendarColor}
          onEditTemplate={context.onEditTemplate}
          onRequestRemove={context.onRequestRemoveBacklogItem}
        />
      ),
    },
  ];
}

export type CalendarSidePanelSectionsContext = {
  monthTitle: string;
  rows: { date: Date; inMonth: boolean }[][];
  selectedDay: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (day: Date) => void;
  onPickCalendarDay: (day: Date) => void;
  showInternalCalendar: boolean;
  onShowInternalCalendarChange: (next: boolean) => void;
  showGoogleCalendar: boolean;
  onShowGoogleCalendarChange: (next: boolean) => void;
  googleCalendarLabel?: string | null;
  internalCalendarColor: string | undefined;
  googleCalendarColor: string | undefined;
  onInternalCalendarColorChange: (color: string | null) => void;
  onGoogleCalendarColorChange: (color: string | null) => void;
  boardOptions: { value: string; label: string }[];
  selectedBoardId: string;
  onSelectedBoardIdChange: (boardId: string) => void;
  isBoardsLoading: boolean;
  tasksLoading: boolean;
  sortedBoardTasks: Task[];
  boardTasksCount: number;
  kindVisibility: CalendarKindVisibility;
  allKindsOn: boolean;
  onKindVisibilityChange: (next: CalendarKindVisibility) => void;
  onToggleKind: (kind: CalendarEventType) => void;
  items: CalendarBacklogEvent[];
  onRequestNewTemplate: () => void;
  onEditTemplate: (item: CalendarBacklogEvent) => void;
  onRequestRemoveBacklogItem: (item: CalendarBacklogEvent) => void;
};
