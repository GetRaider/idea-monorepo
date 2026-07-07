"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/Dialogs";
import {
  buildCalendarSidePanelSections,
  type CalendarSidePanelSectionsContext,
} from "@/components/Calendar/shell/panel/buildCalendarSidePanelSections";
import {
  CALENDAR_SIDE_PANEL_COLLAPSE_POLICY,
  TASK_STATUS_RANK,
} from "@/components/Calendar/shell/panel/calendar-panel.constants";
import {
  monthGrid,
  startOfDay,
} from "@/components/Calendar/shell/panel/calendar-panel-month.helpers";
import type { CalendarPanelProps } from "@/components/Calendar/shell/panel/calendar-panel.types";
import { TaskStatus } from "@/constants/tasks.constants";
import { useWorkspaceRepository } from "@/repositories/workspace";
import type { CalendarEventType } from "@/types/calendar.types";

export function useCalendarSidePanel({
  items,
  onRequestNewTemplate,
  onEditTemplate,
  onRemoveItem,
  kindVisibility,
  onKindVisibilityChange,
  onPickCalendarDay,
  showInternalCalendar,
  onShowInternalCalendarChange,
  showGoogleCalendar,
  onShowGoogleCalendarChange,
  googleCalendarLabel,
  internalCalendarColor,
  googleCalendarColor,
  onInternalCalendarColorChange,
  onGoogleCalendarColorChange,
}: CalendarPanelProps) {
  const [pickerMonth, setPickerMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<
    (typeof items)[number] | null
  >(null);

  const {
    taskBoards,
    isBoardsLoading,
    tasks: boardTasks,
    isTasksLoading: tasksLoading,
  } = useWorkspaceRepository({
    taskBoardId: selectedBoardId || undefined,
  });

  const boardOptions = useMemo(
    () =>
      [...taskBoards]
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((board) => ({
          value: board.id,
          label: `${board.emoji ? `${board.emoji} ` : ""}${board.name}`,
        })),
    [taskBoards],
  );

  const sortedBoardTasks = useMemo(() => {
    const list = boardTasks.filter(
      (task) => !task.scheduleDate && task.status !== TaskStatus.DONE,
    );
    list.sort((left, right) => {
      const leftRank = TASK_STATUS_RANK[left.status] ?? 9;
      const rightRank = TASK_STATUS_RANK[right.status] ?? 9;
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.summary.localeCompare(right.summary);
    });
    return list;
  }, [boardTasks]);

  useEffect(() => {
    if (
      selectedBoardId &&
      !taskBoards.some((board) => board.id === selectedBoardId)
    ) {
      setSelectedBoardId("");
    }
  }, [selectedBoardId, taskBoards]);

  const rows = useMemo(() => monthGrid(pickerMonth), [pickerMonth]);

  const allKindsOn =
    kindVisibility.timeBlock && kindVisibility.common && kindVisibility.task;

  const monthTitle = pickerMonth.toLocaleDateString(undefined, {
    month: "long",
  });

  const toggleKind = useCallback(
    (kind: CalendarEventType) => {
      onKindVisibilityChange({
        ...kindVisibility,
        [kind]: !kindVisibility[kind],
      });
    },
    [kindVisibility, onKindVisibilityChange],
  );

  const handleSelectDay = useCallback((day: Date) => {
    setSelectedDay(day);
    setPickerMonth(new Date(day.getFullYear(), day.getMonth(), 1));
  }, []);

  const sectionsContext = useMemo<CalendarSidePanelSectionsContext>(
    () => ({
      monthTitle,
      rows,
      selectedDay,
      onPreviousMonth: () =>
        setPickerMonth(
          (date) => new Date(date.getFullYear(), date.getMonth() - 1, 1),
        ),
      onNextMonth: () =>
        setPickerMonth(
          (date) => new Date(date.getFullYear(), date.getMonth() + 1, 1),
        ),
      onSelectDay: handleSelectDay,
      onPickCalendarDay,
      showInternalCalendar,
      onShowInternalCalendarChange,
      showGoogleCalendar,
      onShowGoogleCalendarChange,
      googleCalendarLabel,
      internalCalendarColor,
      googleCalendarColor,
      onInternalCalendarColorChange,
      onGoogleCalendarColorChange,
      boardOptions,
      selectedBoardId,
      onSelectedBoardIdChange: setSelectedBoardId,
      isBoardsLoading,
      tasksLoading,
      sortedBoardTasks,
      boardTasksCount: boardTasks.length,
      kindVisibility,
      allKindsOn,
      onKindVisibilityChange,
      onToggleKind: toggleKind,
      items,
      onRequestNewTemplate,
      onEditTemplate,
      onRequestRemoveBacklogItem: setConfirmRemove,
    }),
    [
      allKindsOn,
      boardOptions,
      boardTasks.length,
      googleCalendarColor,
      googleCalendarLabel,
      handleSelectDay,
      internalCalendarColor,
      isBoardsLoading,
      items,
      kindVisibility,
      monthTitle,
      onEditTemplate,
      onGoogleCalendarColorChange,
      onInternalCalendarColorChange,
      onKindVisibilityChange,
      onPickCalendarDay,
      onRequestNewTemplate,
      onShowGoogleCalendarChange,
      onShowInternalCalendarChange,
      rows,
      selectedBoardId,
      selectedDay,
      showGoogleCalendar,
      showInternalCalendar,
      sortedBoardTasks,
      tasksLoading,
      toggleKind,
    ],
  );

  const sections = useMemo(
    () => buildCalendarSidePanelSections(sectionsContext),
    [sectionsContext],
  );

  const dialogs = confirmRemove ? (
    <ConfirmDialog
      title="Remove from backlog?"
      description={`This will permanently delete "${confirmRemove.title}" from the Events Backlog. This action cannot be undone.`}
      confirmLabel="Remove"
      onConfirm={() => onRemoveItem(confirmRemove.id)}
      onClose={() => setConfirmRemove(null)}
    />
  ) : null;

  return {
    sections,
    dialogs,
    collapsePolicy: CALENDAR_SIDE_PANEL_COLLAPSE_POLICY,
  };
}
