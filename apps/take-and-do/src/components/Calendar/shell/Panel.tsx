"use client";

import { ChevronLeft, ChevronRight, LayoutGrid, Pencil } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  InfoCircleIcon,
  PlusIcon,
  DotsVerticalIcon,
  ChevronRightIcon,
} from "@/components/Icons";
import { ConfirmDialog } from "@/components/Dialogs";
import { Dropdown } from "@/components/Dropdown";
import { AppTooltip } from "@/components/Tooltip/AppTooltip";
import { TaskStatusGlyph } from "@/components/TaskStatusGlyph";
import {
  FolderChevron,
  TASKS_SIDEBAR_SECTION_HEADER_TEXT_CLASS,
} from "@/components/TasksSidebar/TasksSidebar.ui";
import { TaskStatus } from "@/constants/tasks.constants";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { useGuestTasks } from "@/hooks/tasks/use-guest-store";
import { useWorkspaces } from "@/hooks/tasks/useWorkspaces";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/styles/utils";
import { clientServices } from "@/services";
import { guestTasksForBoard } from "@/stores/guest/guest-task-filters";
import type { Task } from "@/types/task";
import type {
  CalendarBacklogEvent,
  CalendarEventType,
  CalendarKindVisibility,
} from "@/types/calendar.types";

import { CalendarColorPickerPopover } from "../shared/ColorPickerPopover";
import { CalendarKindIcon } from "../shared/KindIcon";
import {
  effectiveGoogleCalendarColor,
  effectiveInternalCalendarColor,
} from "@/helpers/calendar/calendar-colors";
import { kindLabel } from "@/helpers/calendar/calendar-event-mapper";
import { tasksHelper } from "@/helpers/task.helper";

export interface CalendarPanelProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  items: CalendarBacklogEvent[];
  onRequestNewTemplate: () => void;
  onEditTemplate: (item: CalendarBacklogEvent) => void;
  onRemoveItem: (id: string) => void;
  kindVisibility: CalendarKindVisibility;
  onKindVisibilityChange: (next: CalendarKindVisibility) => void;
  onPickCalendarDay: (date: Date) => void;
  showInternalCalendar: boolean;
  onShowInternalCalendarChange: (next: boolean) => void;
  showGoogleCalendar: boolean;
  onShowGoogleCalendarChange: (next: boolean) => void;
  googleCalendarLabel?: string | null;
  internalCalendarColor: string | undefined;
  googleCalendarColor: string | undefined;
  onInternalCalendarColorChange: (color: string | null) => void;
  onGoogleCalendarColorChange: (color: string | null) => void;
}

export function CalendarPanel({
  containerRef,
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
  const [openSections, setOpenSections] = useState<
    Record<CalPanelSectionId, boolean>
  >(CAL_PANEL_DEFAULT_OPEN);
  const [pickerMonth, setPickerMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [confirmRemove, setConfirmRemove] =
    useState<CalendarBacklogEvent | null>(null);

  const isAnonymous = useIsAnonymous();
  const { taskBoards, isBoardsLoading } = useWorkspaces();
  const { tasks: guestTasks } = useGuestTasks();

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks.byBoard(selectedBoardId),
    queryFn: () => clientServices.tasks.getByBoardId(selectedBoardId),
    enabled: !isAnonymous && !!selectedBoardId,
  });

  const boardOptions = useMemo(
    () =>
      [...taskBoards]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((b) => ({
          value: b.id,
          label: `${b.emoji ? `${b.emoji} ` : ""}${b.name}`,
        })),
    [taskBoards],
  );

  const boardTasks = useMemo(() => {
    if (!selectedBoardId) return [];
    if (isAnonymous) return guestTasksForBoard(guestTasks, selectedBoardId);
    return tasksQuery.data ?? [];
  }, [guestTasks, isAnonymous, selectedBoardId, tasksQuery.data]);

  const sortedBoardTasks = useMemo(() => {
    const list = boardTasks.filter(
      (t) => !t.scheduleDate && t.status !== TaskStatus.DONE,
    );
    list.sort((a, b) => {
      const ra = TASK_STATUS_RANK[a.status] ?? 9;
      const rb = TASK_STATUS_RANK[b.status] ?? 9;
      if (ra !== rb) return ra - rb;
      return a.summary.localeCompare(b.summary);
    });
    return list;
  }, [boardTasks]);

  const tasksLoading =
    !isAnonymous && !!selectedBoardId && tasksQuery.isPending;

  useEffect(() => {
    if (selectedBoardId && !taskBoards.some((b) => b.id === selectedBoardId)) {
      setSelectedBoardId("");
    }
  }, [selectedBoardId, taskBoards]);

  const rows = useMemo(() => monthGrid(pickerMonth), [pickerMonth]);

  const allKindsOn =
    kindVisibility.timeBlock && kindVisibility.common && kindVisibility.task;

  const monthTitle = pickerMonth.toLocaleDateString(undefined, {
    month: "long",
  });

  const toggleKind = (kind: CalendarEventType) => {
    onKindVisibilityChange({
      ...kindVisibility,
      [kind]: !kindVisibility[kind],
    });
  };

  const toggleCalPanelSection = useCallback((id: CalPanelSectionId) => {
    setOpenSections((prev) => {
      if (prev[id]) return { ...prev, [id]: false };
      let next = { ...prev, [id]: true };
      while (CAL_PANEL_SECTION_ORDER.filter((k) => next[k]).length > 2) {
        const victim = CAL_PANEL_SECTION_ORDER.find((k) => next[k] && k !== id);
        if (!victim) break;
        next = { ...next, [victim]: false };
      }
      return next;
    });
  }, []);

  return (
    <aside
      className="calendar-surface flex h-full min-h-0 w-full max-w-[260px] flex-1 flex-col gap-4 overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-background-primary/85 p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md max-[900px]:max-w-none"
      style={{ scrollbarGutter: "stable" }}
    >
      <div
        ref={containerRef as React.LegacyRef<HTMLDivElement>}
        className="contents"
      >
        <section className="space-y-2">
          <div className="flex w-full min-w-0 items-center gap-1 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.06]">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-1 border-0 bg-transparent py-0 text-left text-inherit"
              onClick={() => toggleCalPanelSection("month")}
              aria-expanded={openSections.month}
            >
              <FolderChevron isExpanded={openSections.month}>
                <ChevronRightIcon size={11} />
              </FolderChevron>
              <span className={TASKS_SIDEBAR_SECTION_HEADER_TEXT_CLASS}>
                Month
              </span>
            </button>
            <div className="flex shrink-0 items-center justify-end gap-1.5">
              <button
                type="button"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-text-primary"
                aria-label="Previous month"
                onClick={() =>
                  setPickerMonth(
                    (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeft size={14} aria-hidden />
              </button>
              <span className="min-w-0 max-w-[5.5rem] truncate text-[10px] font-medium leading-tight text-zinc-400">
                {monthTitle}
              </span>
              <button
                type="button"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-text-primary"
                aria-label="Next month"
                onClick={() =>
                  setPickerMonth(
                    (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
                  )
                }
              >
                <ChevronRight size={14} aria-hidden />
              </button>
            </div>
          </div>

          {openSections.month ? (
            <>
              <div className={CAL_PANEL_BODY_GUTTER}>
                <div className="flex max-w-[268px] gap-0 overflow-hidden rounded-lg border border-white/[0.08] bg-black/20">
                  <div className="flex w-6 shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.03] py-1">
                    <div className="h-6 shrink-0" aria-hidden />
                    {rows.map((week, ri) => (
                      <div
                        key={ri}
                        className="flex h-7 items-center justify-center text-[10px] font-medium tabular-nums text-zinc-500"
                      >
                        {isoWeekNumber(week[0].date)}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1 py-1 pr-1">
                    <div className="grid grid-cols-7 gap-0 px-1">
                      {WEEK_LETTERS.map((l, i) => (
                        <div
                          key={`${l}-${i}`}
                          className="flex h-6 items-center justify-center text-[10px] font-semibold text-zinc-500"
                        >
                          {l}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0 px-1">
                      {rows.flatMap((week) =>
                        week.map(({ date, inMonth }) => {
                          const sel = sameDay(date, selectedDay);
                          return (
                            <button
                              key={date.toISOString()}
                              type="button"
                              className={cn(
                                "flex h-7 items-center justify-center rounded-md text-[11px] font-medium tabular-nums transition-colors",
                                !inMonth && "text-zinc-600",
                                inMonth &&
                                  !sel &&
                                  "text-zinc-200 hover:bg-white/[0.08]",
                                sel &&
                                  "bg-zinc-600 text-text-primary shadow-sm hover:bg-zinc-500",
                              )}
                              onClick={() => {
                                const d = startOfDay(date);
                                setSelectedDay(d);
                                setPickerMonth(
                                  new Date(d.getFullYear(), d.getMonth(), 1),
                                );
                                onPickCalendarDay(d);
                              }}
                            >
                              {date.getDate()}
                            </button>
                          );
                        }),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </section>

        <section className="border-t border-white/[0.08] pt-3">
          <button
            type="button"
            className="flex w-full min-w-0 items-center gap-1 rounded-lg border-0 bg-transparent px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
            onClick={() => toggleCalPanelSection("calendars")}
            aria-expanded={openSections.calendars}
          >
            <FolderChevron isExpanded={openSections.calendars}>
              <ChevronRightIcon size={11} />
            </FolderChevron>
            <div className="flex min-w-0 flex-1 items-center">
              <span className={TASKS_SIDEBAR_SECTION_HEADER_TEXT_CLASS}>
                Calendars
              </span>
            </div>
          </button>
          {openSections.calendars ? (
            <ul className={cn("mt-2 space-y-2", CAL_PANEL_BODY_GUTTER)}>
              <li className="group/calPanelInternal flex items-center gap-2 rounded-lg py-0.5 pr-0.5 transition-colors hover:bg-white/[0.04]">
                <input
                  id="cal-internal"
                  type="checkbox"
                  checked={showInternalCalendar}
                  onChange={(e) =>
                    onShowInternalCalendarChange(e.target.checked)
                  }
                  className="h-4 w-4 shrink-0 cursor-pointer rounded border border-white/25 bg-input-bg/80 accent-zinc-200"
                />
                <label
                  htmlFor="cal-internal"
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-zinc-200"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{
                      backgroundColor: effectiveInternalCalendarColor(
                        internalCalendarColor,
                      ),
                    }}
                    aria-hidden
                  />
                  <span className="truncate">Internal</span>
                </label>
                <div
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center text-zinc-500 opacity-0 transition-opacity duration-150",
                    "group-hover/calPanelInternal:opacity-100",
                  )}
                >
                  <CalendarColorPickerPopover
                    selectedHex={effectiveInternalCalendarColor(
                      internalCalendarColor,
                    )}
                    onSelect={(hex) => onInternalCalendarColorChange(hex)}
                    onResetToDefault={() => onInternalCalendarColorChange(null)}
                    trigger={<DotsVerticalIcon size={14} />}
                  />
                </div>
              </li>
              <li className="group/calPanelGcal flex items-center gap-2 rounded-lg py-0.5 pr-0.5 transition-colors hover:bg-white/[0.04]">
                <input
                  id="cal-google"
                  type="checkbox"
                  checked={showGoogleCalendar}
                  onChange={(e) => onShowGoogleCalendarChange(e.target.checked)}
                  className="h-4 w-4 shrink-0 cursor-pointer rounded border border-white/25 bg-input-bg/80 accent-zinc-200"
                />
                <label
                  htmlFor="cal-google"
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-zinc-200"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{
                      backgroundColor:
                        effectiveGoogleCalendarColor(googleCalendarColor),
                    }}
                    aria-hidden
                  />
                  <span className="truncate">
                    {googleCalendarLabel
                      ? `${googleCalendarLabel}`
                      : "Google Calendar"}
                  </span>
                </label>
                <div
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center text-zinc-500 opacity-0 transition-opacity duration-150",
                    "group-hover/calPanelGcal:opacity-100",
                  )}
                >
                  <CalendarColorPickerPopover
                    selectedHex={effectiveGoogleCalendarColor(
                      googleCalendarColor,
                    )}
                    onSelect={(hex) => onGoogleCalendarColorChange(hex)}
                    onResetToDefault={() => onGoogleCalendarColorChange(null)}
                    trigger={<DotsVerticalIcon size={14} />}
                  />
                </div>
              </li>
            </ul>
          ) : null}
        </section>

        <section className="border-t border-white/[0.08] pt-3">
          <button
            type="button"
            className="flex w-full min-w-0 items-center gap-1 rounded-lg border-0 bg-transparent px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
            onClick={() => toggleCalPanelSection("tasks")}
            aria-expanded={openSections.tasks}
          >
            <FolderChevron isExpanded={openSections.tasks}>
              <ChevronRightIcon size={11} />
            </FolderChevron>
            <div className="flex min-w-0 flex-1 items-center">
              <span className={TASKS_SIDEBAR_SECTION_HEADER_TEXT_CLASS}>
                Tasks
              </span>
            </div>
          </button>

          {openSections.tasks ? (
            <div className={cn("mt-2 space-y-2", CAL_PANEL_BODY_GUTTER)}>
              <Dropdown
                fullWidth
                options={boardOptions}
                value={selectedBoardId || undefined}
                onChange={(id) => setSelectedBoardId(id)}
                placeholder={
                  isBoardsLoading ? "Loading boards…" : "Select a board…"
                }
                disabled={isBoardsLoading || boardOptions.length === 0}
              />
              {!selectedBoardId ? (
                <p className="text-xs leading-snug text-zinc-500">
                  Choose a board to list tasks you can drag to the grid.
                </p>
              ) : isBoardsLoading || tasksLoading ? (
                <p className="text-xs text-zinc-500">Loading tasks…</p>
              ) : sortedBoardTasks.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  {boardTasks.length > 0
                    ? "No tasks to drag (scheduled or completed tasks are hidden)."
                    : "No tasks on this board."}
                </p>
              ) : (
                <ul className="flex max-h-[220px] min-h-[60px] flex-col gap-2 overflow-y-auto pr-0.5">
                  {sortedBoardTasks.map((task: Task) => (
                    <li key={task.id}>
                      <div
                        className="calendar-panel-task-draggable cursor-grab rounded-lg border border-white/10 bg-input-bg/90 px-3 py-2 transition-colors hover:border-white/18 active:cursor-grabbing"
                        data-calendar-task-board-id={task.taskBoardId}
                        data-calendar-task-id={task.id}
                        data-calendar-task-title={task.summary}
                        data-calendar-task-summary-snapshot={task.summary}
                        data-calendar-task-duration-minutes={String(
                          TASK_DRAG_DURATION_MINUTES,
                        )}
                        title={`${task.status} · ${tasksHelper.priority.getName(
                          tasksHelper.priority.format(task.priority),
                        )}`}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="inline-flex shrink-0 items-center justify-center"
                            aria-hidden
                          >
                            <TaskStatusGlyph status={task.status} size={14} />
                          </span>
                          <span
                            className="flex shrink-0 items-center justify-center text-[13px] leading-none"
                            aria-hidden
                          >
                            {tasksHelper.priority.getIconLabel(
                              tasksHelper.priority.format(task.priority),
                            )}
                          </span>
                          <div className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                            {task.summary}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!isBoardsLoading && boardOptions.length === 0 ? (
                <p className="text-xs leading-snug text-zinc-500">
                  Create a task board under Tasks to drag work onto the
                  calendar.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="border-t border-white/[0.08] pt-3">
          <button
            type="button"
            className="flex w-full min-w-0 items-center gap-1 rounded-lg border-0 bg-transparent px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
            onClick={() => toggleCalPanelSection("eventTypes")}
            aria-expanded={openSections.eventTypes}
          >
            <FolderChevron isExpanded={openSections.eventTypes}>
              <ChevronRightIcon size={11} />
            </FolderChevron>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className={TASKS_SIDEBAR_SECTION_HEADER_TEXT_CLASS}>
                Event Types
              </span>
              <AppTooltip content="Filter which event types show on the calendar.">
                <span className="inline-flex">
                  <InfoCircleIcon size={16} className="text-zinc-500" />
                </span>
              </AppTooltip>
            </div>
          </button>

          {openSections.eventTypes ? (
            <ul className={cn("mt-2 space-y-2", CAL_PANEL_BODY_GUTTER)}>
              <li className="flex items-center gap-2">
                <input
                  id="cal-all"
                  type="checkbox"
                  checked={allKindsOn}
                  onChange={(e) => {
                    const on = e.target.checked;
                    onKindVisibilityChange({
                      timeBlock: on,
                      common: on,
                      task: on,
                    });
                  }}
                  className="h-4 w-4 cursor-pointer rounded border border-white/25 bg-input-bg/80 accent-zinc-200"
                />
                <label
                  htmlFor="cal-all"
                  className="flex min-w-0 cursor-pointer items-center gap-2 truncate text-sm text-zinc-200"
                >
                  <LayoutGrid
                    size={16}
                    className="shrink-0 text-zinc-400"
                    strokeWidth={2}
                    aria-hidden
                  />
                  All
                </label>
              </li>
              {CALENDAR_ROWS.map(({ kind, label }) => (
                <li
                  key={kind}
                  className="flex items-center gap-2 rounded-lg py-0.5 pr-0.5"
                >
                  <input
                    id={`cal-${kind}`}
                    type="checkbox"
                    checked={kindVisibility[kind]}
                    onChange={() => toggleKind(kind)}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border border-white/25 bg-input-bg/80 accent-zinc-200"
                  />
                  <label
                    htmlFor={`cal-${kind}`}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-zinc-200"
                  >
                    <CalendarKindIcon kind={kind} size={16} aria-hidden />
                    <span className="truncate">{label}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section
          className={cn(
            "border-t border-white/[0.08] pt-3",
            openSections.backlog && "flex min-h-0 flex-1 flex-col",
          )}
        >
          <div className="flex w-full shrink-0 min-w-0 items-center gap-1 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.06]">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-1 border-0 bg-transparent py-0 text-left text-inherit"
              onClick={() => toggleCalPanelSection("backlog")}
              aria-expanded={openSections.backlog}
            >
              <FolderChevron isExpanded={openSections.backlog}>
                <ChevronRightIcon size={11} />
              </FolderChevron>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className={TASKS_SIDEBAR_SECTION_HEADER_TEXT_CLASS}>
                  Events Backlog
                </span>
                <AppTooltip content="Reusable backlog events">
                  <span className="inline-flex">
                    <InfoCircleIcon size={16} className="text-zinc-500" />
                  </span>
                </AppTooltip>
              </div>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={onRequestNewTemplate}
                className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent text-zinc-400 hover:bg-white/[0.06] hover:text-text-primary"
                aria-label="Add backlog template"
                title="Add backlog template"
              >
                <PlusIcon size={16} aria-hidden />
              </button>
            </div>
          </div>

          {openSections.backlog ? (
            <div className="mt-2 flex min-h-0 flex-1 flex-col space-y-2">
              <div
                className={cn(
                  "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto",
                  CAL_PANEL_BODY_GUTTER,
                )}
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "calendar-backlog-draggable group cursor-grab rounded-lg border border-white/10 bg-input-bg/90 px-3 py-2.5 transition-colors hover:border-white/18 active:cursor-grabbing",
                    )}
                    data-backlog-id={item.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="min-w-0 flex-1 cursor-grab text-left"
                      >
                        <div
                          className="mb-0.5 inline-flex h-6 w-6 items-center justify-center rounded"
                          style={{
                            backgroundColor: effectiveInternalCalendarColor(
                              internalCalendarColor,
                            ),
                          }}
                          title={kindLabel(item.type)}
                          aria-label={kindLabel(item.type)}
                        >
                          <CalendarKindIcon
                            kind={item.type}
                            size={14}
                            color="#fafafa"
                          />
                        </div>
                        <div className="truncate text-sm font-medium text-text-primary">
                          {item.title}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {item.durationMinutes} min
                        </div>
                      </button>
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <button
                          type="button"
                          className="rounded-md border-0 bg-transparent p-1 text-zinc-400 opacity-80 transition-all hover:bg-zinc-800 hover:text-text-primary group-hover:opacity-100"
                          title="Edit template"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => onEditTemplate(item)}
                        >
                          <Pencil size={14} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="rounded-md border-0 bg-transparent px-1 py-0.5 text-lg leading-none text-zinc-500 hover:bg-zinc-800 hover:text-text-primary"
                          title="Remove event"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => setConfirmRemove(item)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {confirmRemove ? (
          <ConfirmDialog
            title="Remove from backlog?"
            description={`This will permanently delete "${confirmRemove.title}" from the Events Backlog. This action cannot be undone.`}
            confirmLabel="Remove"
            onConfirm={() => onRemoveItem(confirmRemove.id)}
            onClose={() => setConfirmRemove(null)}
          />
        ) : null}
      </div>
    </aside>
  );
}

const WEEK_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;

/** Match section header `px-2` so body lines up with chevron leading edge. */
const CAL_PANEL_BODY_GUTTER = "pl-2 pr-1" as const;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function mondayBefore(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + offset);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isoWeekNumber(anchor: Date) {
  const d = new Date(
    Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()),
  );
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - y.getTime()) / 86400000 + 1) / 7);
}

function monthGrid(visibleMonth: Date) {
  const y = visibleMonth.getFullYear();
  const m = visibleMonth.getMonth();
  const first = new Date(y, m, 1);
  const gridStart = mondayBefore(first);
  const cells: { date: Date; inMonth: boolean }[] = [];
  const cur = new Date(gridStart);
  for (let i = 0; i < 42; i++) {
    cells.push({
      date: new Date(cur),
      inMonth: cur.getMonth() === m,
    });
    cur.setDate(cur.getDate() + 1);
  }
  const rows: (typeof cells)[] = [];
  for (let r = 0; r < 6; r++) {
    rows.push(cells.slice(r * 7, r * 7 + 7));
  }
  return rows;
}

const CALENDAR_ROWS: { kind: CalendarEventType; label: string }[] = [
  { kind: "timeBlock", label: "Time Blocks" },
  { kind: "common", label: "Common" },
  { kind: "task", label: "Tasks" },
];

const TASK_DRAG_DURATION_MINUTES = 60;

const TASK_STATUS_RANK: Record<TaskStatus, number> = {
  [TaskStatus.IN_PROGRESS]: 0,
  [TaskStatus.TODO]: 1,
  [TaskStatus.DONE]: 2,
};

const CAL_PANEL_SECTION_ORDER = [
  "month",
  "calendars",
  "tasks",
  "eventTypes",
  "backlog",
] as const;

type CalPanelSectionId = (typeof CAL_PANEL_SECTION_ORDER)[number];

const CAL_PANEL_DEFAULT_OPEN: Record<CalPanelSectionId, boolean> = {
  month: true,
  calendars: false,
  tasks: false,
  eventTypes: false,
  backlog: false,
};
