"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { cn } from "@repo/ui";

import { CalendarIcon, ChevronIcon, TasksIcon } from "@components/icons";

import { blocksForRange, visibleBlocks, type CalendarBlock } from "./calendar-blocks";
import { blockColor, fillIsLight } from "./calendar-colors";
import { deviceTimeZone } from "./calendar-datetime";
import {
  ensureTimegridOverlapLayoutObserver,
  overlapStamp,
  scheduleRepaintTimegridOverlapLayout,
} from "./calendar-overlap";
import { CalendarDraft, type DraftSelection } from "./calendar-draft";
import { CalendarQuickMenu, type QuickMenuState } from "./calendar-quick-menu";
import { useCalendar } from "./calendar-provider";
import "./calendar.css";

export function CalendarGrid() {
  const calendarRef = useRef<FullCalendar>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const clickTimer = useRef<number | null>(null);
  const [viewId, setViewId] = useState("timeGridRollingWeek");
  const [menuOpen, setMenuOpen] = useState(false);
  const [slotMinutes, setSlotMinutes] = useState<15 | 30>(30);
  const [hour12, setHour12] = useState(false);
  const [draft, setDraft] = useState<DraftSelection | null>(null);
  const [quickMenu, setQuickMenu] = useState<QuickMenuState | null>(null);
  const {
    state: { events, tasks, boards, range, visibility, focusRequest },
    actions: { setRange, openEvent, openTask, createEvent, updateEvent, removeEvent, updateTask },
  } = useCalendar();
  const blocks = useMemo(
    () =>
      visibleBlocks(
        blocksForRange(events, tasks, new Date(range.from), new Date(range.to)),
        visibility,
      ),
    [events, tasks, range.from, range.to, visibility],
  );
  const timeZone = deviceTimeZone();
  const meta = toolbarMeta(range.from, range.to);

  useEffect(() => {
    if (!focusRequest) return;
    calendarRef.current?.getApi().gotoDate(focusRequest.date);
  }, [focusRequest]);

  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  useEffect(() => {
    ensureTimegridOverlapLayoutObserver(rootRef.current, () => blocksRef.current);
  }, []);

  useLayoutEffect(() => {
    scheduleRepaintTimegridOverlapLayout(rootRef.current, blocks);
  }, [blocks]);

  const dayCount = DAY_COUNT[viewId] ?? 7;

  return (
    <div
      ref={rootRef}
      className="todex-calendar flex min-h-0 flex-1 flex-col"
      data-draft-kind={draft?.kind}
      data-time-grid-slot-min={slotMinutes}
      style={{ ["--todex-day-count" as string]: String(dayCount) }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-3 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-border bg-surface px-2 py-2">
            <span className="text-[10px] font-semibold tracking-wide text-muted-foreground">
              {meta.badgeMonth}
            </span>
            <span className="text-xl font-semibold tabular-nums leading-none">
              {meta.badgeDay}
            </span>
          </div>
          <div className="min-w-0 pb-0.5">
            <p className="text-lg font-semibold tracking-tight">{meta.headline}</p>
            <p className="text-sm text-muted-foreground">{meta.rangeLabel}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {VIEW_LABELS[viewId] ?? "Week"}
              <ChevronIcon
                size={14}
                className={cn("text-muted-foreground transition-transform", menuOpen && "rotate-90")}
              />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-44 rounded-xl border border-border bg-popover p-1 shadow-lg">
                {VIEW_OPTIONS.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    className="flex w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      calendarRef.current?.getApi().changeView(view.id);
                      setViewId(view.id);
                      setMenuOpen(false);
                    }}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex items-center rounded-xl border border-border bg-surface p-0.5">
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm hover:bg-accent"
              onClick={() => calendarRef.current?.getApi().today()}
            >
              Today
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
              aria-label="Previous"
              onClick={() => calendarRef.current?.getApi().prev()}
            >
              <ChevronIcon size={16} className="rotate-180" />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
              aria-label="Next"
              onClick={() => calendarRef.current?.getApi().next()}
            >
              <ChevronIcon size={16} />
            </button>
          </div>
          <div className="flex items-center rounded-xl border border-border bg-surface p-0.5">
            <button
              type="button"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent disabled:opacity-40"
              aria-label="Zoom out"
              disabled={slotMinutes === 30}
              onClick={() => setSlotMinutes(30)}
            >
              −
            </button>
            <span className="px-1 text-xs text-muted-foreground">Zoom</span>
            <button
              type="button"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent disabled:opacity-40"
              aria-label="Zoom in"
              disabled={slotMinutes === 15}
              onClick={() => setSlotMinutes(15)}
            >
              +
            </button>
          </div>
          <div className="flex items-center rounded-xl border border-border bg-surface p-0.5">
            <button
              type="button"
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium",
                hour12 ? "bg-accent text-foreground" : "text-muted-foreground",
              )}
              onClick={() => setHour12(true)}
            >
              12h
            </button>
            <button
              type="button"
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium",
                !hour12 ? "bg-accent text-foreground" : "text-muted-foreground",
              )}
              onClick={() => setHour12(false)}
            >
              24h
            </button>
          </div>
        </div>
      </div>
      <div ref={gridRef} className="relative min-h-0 flex-1 px-2 pb-2">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridRollingWeek"
          headerToolbar={false}
          height="100%"
          nowIndicator
          selectable
          selectMirror={false}
          selectMinDistance={5}
          unselectCancel=".calendar-draft,.calendar-quick-menu,[data-radix-popper-content-wrapper]"
          droppable
          editable
          eventResizableFromStart
          eventDurationEditable
          slotEventOverlap
          firstDay={1}
          slotDuration={slotMinutes === 15 ? "00:15:00" : "00:30:00"}
          snapDuration="00:15:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12,
            meridiem: "short",
          }}
          scrollTime={scrollTime()}
          allDaySlot
          allDayText="All day"
          views={CALENDAR_VIEWS}
          events={blocks.map((block) => ({
            id: block.key,
            title: block.title,
            start: block.start,
            end: block.end,
            allDay: block.allDay,
            backgroundColor: blockColor(block.kind, block.color),
            borderColor: "transparent",
            editable: !block.readOnly,
            classNames: chipClassNames(block),
            extendedProps: block,
          }))}
          dayHeaderContent={(arg) => (
            <DayHeader date={arg.date} isToday={arg.isToday} />
          )}
          nowIndicatorContent={(arg) =>
            arg.isAxis ? <span className="todex-now-pill">{formatClock(arg.date, hour12)}</span> : null
          }
          eventContent={(arg) => <CalendarChip arg={arg} hour12={hour12} />}
          datesSet={(arg) => {
            setViewId(arg.view.type);
            rememberRange(arg, setRange);
            const axis = rootRef.current?.querySelector(
              ".fc-col-header .fc-timegrid-axis",
            );
            if (axis) axis.textContent = shortZoneName();
          }}
          select={(selection) => {
            const point = selection.jsEvent;
            const frame = gridRef.current;
            if (!point || !frame) return;
            const anchor = menuAnchor(frame, point.clientX, point.clientY, 320, 240);
            setQuickMenu(null);
            setDraft({
              start: selection.start,
              end: selection.end,
              allDay: selection.allDay,
              kind: "event",
              left: anchor.left,
              top: anchor.top,
              maxHeight: anchor.maxHeight,
            });
          }}
          unselect={() => setDraft(null)}
          eventClick={(arg) => {
            const block = arg.event.extendedProps as CalendarBlock;
            if (block.kind === "event" && arg.jsEvent.detail > 1) {
              if (clickTimer.current) window.clearTimeout(clickTimer.current);
              openQuickMenu(arg.jsEvent, block, gridRef.current, setQuickMenu);
              return;
            }
            if (block.kind === "event") {
              clickTimer.current = window.setTimeout(() => {
                openBlock(arg, openEvent, openTask);
              }, 220);
              return;
            }
            openBlock(arg, openEvent, openTask);
          }}
          eventsSet={() => {
            scheduleRepaintTimegridOverlapLayout(rootRef.current, blocksRef.current);
          }}
          eventDidMount={(info) => {
            scheduleRepaintTimegridOverlapLayout(rootRef.current, blocksRef.current);
            info.el.addEventListener("contextmenu", (mouseEvent) => {
              const block = info.event.extendedProps as CalendarBlock;
              if (block.kind !== "event") return;
              mouseEvent.preventDefault();
              if (clickTimer.current) window.clearTimeout(clickTimer.current);
              openQuickMenu(mouseEvent, block, gridRef.current, setQuickMenu);
            });
            info.el.addEventListener("dblclick", (mouseEvent) => {
              const block = info.event.extendedProps as CalendarBlock;
              if (block.kind !== "event") return;
              mouseEvent.preventDefault();
              if (clickTimer.current) window.clearTimeout(clickTimer.current);
              openQuickMenu(mouseEvent, block, gridRef.current, setQuickMenu);
            });
          }}
          eventDrop={(arg) => {
            void moveBlock(arg, updateEvent, updateTask);
          }}
          eventResize={(arg) => {
            void resizeBlock(arg, updateEvent, updateTask);
          }}
          eventReceive={(arg) => {
            const taskId = arg.event.extendedProps.taskId as string | undefined;
            const templateId = arg.event.extendedProps.templateId as string | undefined;
            const title = arg.event.title;
            const start = arg.event.start;
            const end = arg.event.end;
            arg.event.remove();
            if (!start || !end) return;
            if (taskId) {
              void updateTask(taskId, { scheduleDate: start.toISOString() });
              return;
            }
            if (!templateId) return;
            void createEvent({
              title,
              start: start.toISOString(),
              end: end.toISOString(),
              allDay: arg.event.allDay,
              timeZone,
              color: (arg.event.extendedProps.color as string | null | undefined) ?? null,
              description:
                (arg.event.extendedProps.description as string | undefined) ?? "",
              taskScope:
                (arg.event.extendedProps.taskScope as string[] | undefined) ?? [],
            });
          }}
        />
        {draft ? (
        <CalendarDraft
          key={`${draft.start.toISOString()}-${draft.end.toISOString()}-${draft.allDay}`}
          draft={draft}
          tasks={tasks}
          boards={boards}
          onKind={(kind) =>
            setDraft((current) => (current ? { ...current, kind } : current))
          }
          onCancel={() => calendarRef.current?.getApi().unselect()}
          onCreate={async (body) => {
            if (body.kind === "task") {
              await updateTask(body.taskId, {
                scheduleDate: body.scheduleDate,
                estimation: body.estimation,
              });
            } else {
              await createEvent({
                title: body.title,
                start: body.start,
                end: body.end,
                allDay: body.allDay,
                color: body.color,
                timeZone,
                recurrence: body.recurrence,
                taskScope: body.taskScope,
              });
            }
            calendarRef.current?.getApi().unselect();
          }}
        />
      ) : null}
        {quickMenu ? (
          <CalendarQuickMenu
            menu={quickMenu}
            event={events.find((event) => event.id === quickMenu.block.eventId) ?? null}
            onClose={() => setQuickMenu(null)}
            onRsvp={(status) => {
              const source = events.find((event) => event.id === quickMenu.block.eventId);
              if (!source) return;
              void updateEvent(source.id, {
                rsvpStatus: source.rsvpStatus === status ? null : status,
                ...(quickMenu.block.series && quickMenu.block.originalStart
                  ? { scope: "instance", originalStart: quickMenu.block.originalStart }
                  : {}),
              });
            }}
            onDelete={() => {
              const block = quickMenu.block;
              if (!block.eventId) return;
              if (block.series && block.originalStart) {
                void removeEvent(block.eventId, "instance", block.originalStart);
                return;
              }
              void removeEvent(block.eventId);
            }}
            onDuplicate={() => {
              const source = events.find((event) => event.id === quickMenu.block.eventId);
              if (!source) return;
              void createEvent({
                title: source.title,
                start: quickMenu.block.start.toISOString(),
                end: quickMenu.block.end.toISOString(),
                allDay: quickMenu.block.allDay,
                color: source.color,
                timeZone: source.timeZone || timeZone,
                description: source.description,
                taskScope: source.taskScope,
                participants: source.participants,
              });
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function DayHeader({ date, isToday }: { date: Date; isToday: boolean }) {
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums">
      <span className={isToday ? "text-foreground" : undefined}>{date.getDate()}</span>
      <span className="font-medium text-muted-foreground">{weekday}</span>
    </span>
  );
}

function CalendarChip({ arg, hour12 }: { arg: EventContentArg; hour12: boolean }) {
  const block = arg.event.extendedProps as CalendarBlock;
  const start = arg.event.start;
  const end = arg.event.end;
  const time =
    !arg.event.allDay && start && end ? formatRange(start, end, hour12) : null;
  const Icon = block.kind === "task" ? TasksIcon : CalendarIcon;
  const rsvp = rsvpLabel(block.rsvpStatus);
  return (
    <div
      className="fc-event-main-frame todex-cal-event-inner"
      {...overlapStamp(block)}
    >
      <Icon size={11} className="todex-cal-secondary mt-px shrink-0" />
      <span className="todex-cal-title text-[10px] font-medium leading-tight">
        {arg.event.title}
      </span>
      {time ? (
        <span className="todex-cal-secondary text-[9px] tabular-nums leading-tight">
          {time}
        </span>
      ) : null}
      {rsvp ? (
        <span className="todex-cal-secondary text-[9px] font-semibold">{rsvp}</span>
      ) : null}
    </div>
  );
}

function rsvpLabel(status: CalendarBlock["rsvpStatus"]) {
  if (status === "no") return "NO";
  if (status === "maybe") return "MAYBE";
  return null;
}

function openBlock(
  arg: EventClickArg,
  openEvent: (eventId: string, originalStart?: string | null) => void,
  openTask: (taskId: string) => void,
) {
  const block = arg.event.extendedProps as {
    kind?: string;
    eventId?: string | null;
    taskId?: string | null;
    originalStart?: string | null;
    seriesEventId?: string | null;
  };
  if (block.kind === "task" && block.taskId) {
    openTask(block.taskId);
    return;
  }
  const eventId = block.originalStart
    ? block.seriesEventId
    : block.eventId;
  if (eventId) openEvent(eventId, block.originalStart);
}

async function moveBlock(
  arg: EventDropArg,
  updateEvent: (eventId: string, body: unknown) => Promise<unknown>,
  updateTask: (
    taskId: string,
    patch: { scheduleDate?: string | null },
  ) => Promise<unknown>,
) {
  const block = arg.event.extendedProps as {
    kind?: string;
    eventId?: string | null;
    taskId?: string | null;
    originalStart?: string | null;
    series?: boolean;
  };
  const start = arg.event.start;
  const end = arg.event.end;
  if (!start || !end) return arg.revert();
  try {
    if (block.kind === "task" && block.taskId) {
      await updateTask(block.taskId, { scheduleDate: start.toISOString() });
      return;
    }
    if (!block.eventId) return arg.revert();
    await updateEvent(block.eventId, {
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: arg.event.allDay,
      ...(block.series && block.originalStart
        ? { scope: "instance", originalStart: block.originalStart }
        : { scope: "series" }),
    });
  } catch {
    arg.revert();
  }
}

async function resizeBlock(
  arg: EventResizeDoneArg,
  updateEvent: (eventId: string, body: unknown) => Promise<unknown>,
  updateTask: (
    taskId: string,
    patch: { scheduleDate?: string; estimation?: number },
  ) => Promise<unknown>,
) {
  const block = arg.event.extendedProps as {
    kind?: string;
    eventId?: string | null;
    taskId?: string | null;
    originalStart?: string | null;
    series?: boolean;
  };
  const start = arg.event.start;
  const end = arg.event.end;
  if (!start || !end) return arg.revert();
  try {
    if (block.kind === "task" && block.taskId) {
      const minutes = Math.max(
        15,
        Math.round((end.getTime() - start.getTime()) / 60_000),
      );
      await updateTask(block.taskId, {
        scheduleDate: start.toISOString(),
        estimation: minutes,
      });
      return;
    }
    if (!block.eventId) return arg.revert();
    await updateEvent(block.eventId, {
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: arg.event.allDay,
      ...(block.series && block.originalStart
        ? { scope: "instance", originalStart: block.originalStart }
        : { scope: "series" }),
    });
  } catch {
    arg.revert();
  }
}

function rememberRange(
  arg: DatesSetArg,
  setRange: (range: { from: string; to: string }) => void,
) {
  setRange({ from: arg.start.toISOString(), to: arg.end.toISOString() });
}

function toolbarMeta(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  end.setDate(end.getDate() - 1);
  const month = start.toLocaleDateString(undefined, { month: "long" });
  const endMonth = end.toLocaleDateString(undefined, { month: "long" });
  const year = start.getFullYear();
  const rangeLabel =
    start.getMonth() === end.getMonth()
      ? `${month} ${start.getDate()} – ${end.getDate()}, ${year}`
      : `${month} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
  return {
    badgeMonth: start.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    badgeDay: String(start.getDate()),
    headline: `${month} (${isoWeekNumber(start)}) ${year}`,
    rangeLabel,
  };
}

function isoWeekNumber(anchor: Date) {
  const date = new Date(
    Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatClock(date: Date, hour12: boolean) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  }).format(date);
}

function formatRange(start: Date, end: Date, hour12: boolean) {
  return `${formatClock(start, hour12)}–${formatClock(end, hour12)}`;
}

function shortZoneName() {
  const part = new Intl.DateTimeFormat(undefined, {
    timeZoneName: "short",
  })
    .formatToParts(new Date())
    .find((item) => item.type === "timeZoneName");
  return part?.value ?? "";
}

function menuAnchor(
  frame: HTMLElement,
  clientX: number,
  clientY: number,
  menuWidth: number,
  menuHeight: number,
) {
  const rect = frame.getBoundingClientRect();
  const left = clamp(clientX - rect.left, 8, Math.max(8, rect.width - menuWidth - 8));
  const top = clamp(clientY - rect.top + 8, 8, Math.max(8, rect.height - 48));
  return {
    left,
    top,
    maxHeight: Math.max(menuHeight, rect.height - top - 8),
  };
}

function openQuickMenu(
  mouseEvent: { clientX: number; clientY: number },
  block: CalendarBlock,
  frame: HTMLDivElement | null,
  setQuickMenu: (menu: QuickMenuState | null) => void,
) {
  if (!frame) return;
  const anchor = menuAnchor(frame, mouseEvent.clientX, mouseEvent.clientY, 160, 148);
  setQuickMenu({ block, left: anchor.left, top: anchor.top });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function chipClassNames(block: CalendarBlock) {
  const fill = blockColor(block.kind, block.color);
  return [
    "todex-cal-chip",
    block.kind === "task" ? "todex-cal-task" : "",
    fillIsLight(fill) ? "todex-cal-light" : "",
    block.rsvpStatus === "no" ? "todex-cal-rsvp-no" : "",
    block.rsvpStatus === "maybe" ? "todex-cal-rsvp-maybe" : "",
  ].filter(Boolean);
}

function scrollTime(): string {
  const now = new Date();
  const hour = Math.max(0, now.getHours() - 2);
  return `${String(hour).padStart(2, "0")}:00:00`;
}

const DAY_COUNT: Record<string, number> = {
  timeGridDay: 1,
  timeGridTwoDay: 2,
  timeGridThreeDay: 3,
  timeGridFourDay: 4,
  timeGridFiveDay: 5,
  timeGridRollingWeek: 7,
};

const VIEW_OPTIONS = [
  { id: "timeGridDay", label: "Day" },
  { id: "timeGridTwoDay", label: "2 days" },
  { id: "timeGridThreeDay", label: "3 days" },
  { id: "timeGridFourDay", label: "4 days" },
  { id: "timeGridFiveDay", label: "5 days" },
  { id: "timeGridRollingWeek", label: "Week" },
] as const;

const VIEW_LABELS: Record<string, string> = Object.fromEntries(
  VIEW_OPTIONS.map((view) => [view.id, view.label]),
);

const CALENDAR_VIEWS = {
  timeGridTwoDay: { type: "timeGrid", duration: { days: 2 } },
  timeGridThreeDay: { type: "timeGrid", duration: { days: 3 } },
  timeGridFourDay: { type: "timeGrid", duration: { days: 4 } },
  timeGridFiveDay: { type: "timeGrid", duration: { days: 5 } },
  timeGridRollingWeek: {
    type: "timeGrid",
    duration: { days: 7 },
    dateAlignment: "day",
  },
} as const;
