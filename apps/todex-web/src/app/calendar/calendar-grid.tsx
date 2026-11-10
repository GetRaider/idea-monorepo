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
import { CalendarIcon, TasksIcon } from "@components/icons";

import { formatChipRange } from "./calendar-actual";
import { blocksForRange, visibleBlocks, type CalendarBlock } from "./calendar-blocks";
import { deviceTimeZone } from "./calendar-datetime";
import {
  ensureTimegridOverlapLayoutObserver,
  overlapStamp,
  scheduleRepaintTimegridOverlapLayout,
  stampHarnessEvent,
} from "./calendar-overlap";
import { CalendarDraft, type DraftFields, type DraftSelection } from "./calendar-draft";
import { CalendarEventPreview, type EventPreview } from "./calendar-event-preview";
import { useCalendar } from "./calendar-provider";
import { CalendarToolbar } from "./calendar-toolbar";
import "./calendar.css";

export function CalendarGrid() {
  const calendarRef = useRef<FullCalendar>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const draftFormRef = useRef<HTMLFormElement>(null);
  const draftOriginRef = useRef<SelectionOrigin | null>(null);
  const keepDraftFields = useRef(false);
  const [draft, setDraft] = useState<DraftSelection | null>(null);
  const [draftSession, setDraftSession] = useState(0);
  const [preview, setPreview] = useState<EventPreview | null>(null);
  useLayoutEffect(() => {
    const form = draftFormRef.current;
    const frame = gridRef.current;
    const origin = draftOriginRef.current;
    if (!draft || !form || !frame || !origin) return;
    const anchor = menuAnchor(
      frame,
      origin,
      DRAFT_MENU_WIDTH,
      form.scrollHeight + form.offsetHeight - form.clientHeight,
    );
    if (
      Math.abs(anchor.left - draft.left) < 1 &&
      Math.abs(anchor.top - draft.top) < 1 &&
      Math.abs(anchor.maxHeight - draft.maxHeight) < 1
    ) {
      return;
    }
    setDraft((current) => (current ? { ...current, ...anchor } : current));
  }, [draft]);
  const {
    state: { events, tasks, sessions, boards, range, visibility, focusRequest, mode, dayCount, preferencesReady },
    actions: { setRange, openEvent, openTask, openComposer, openSession, createEvent, updateEvent, updateTask },
  } = useCalendar();
  const timeZone = deviceTimeZone();
  const blocks = useMemo(
    () =>
      visibleBlocks(
        blocksForRange(
          events,
          tasks,
          sessions,
          boards,
          new Date(range.from),
          new Date(range.to),
          new Date(),
          timeZone,
        ),
        visibility,
        mode,
      ),
    [events, tasks, sessions, boards, range.from, range.to, visibility, mode, timeZone],
  );

  useEffect(() => {
    if (!focusRequest) return;
    calendarRef.current?.getApi().gotoDate(focusRequest.date);
  }, [focusRequest]);

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  useEffect(() => {
    ensureTimegridOverlapLayoutObserver(
      rootRef.current,
      () => blocksRef.current,
      () => modeRef.current,
    );
  }, []);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api || !preferencesReady) return;
    const view = CALENDAR_VIEW_BY_DAY_COUNT[dayCount];
    if (!view || api.view.type === view) return;
    api.changeView(view);
  }, [dayCount, preferencesReady]);

  useEffect(() => {
    if (!preview) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".calendar-event-preview, .fc-event")) return;
      setPreview(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [preview]);

  useLayoutEffect(() => {
    scheduleRepaintTimegridOverlapLayout(rootRef.current, blocks, mode);
  }, [blocks, mode]);

  const dayCountForGrid = dayCount;

  function openFullEditor(fields: DraftFields) {
    openComposer({
      title: fields.title,
      taskId: fields.taskId,
      kind: fields.kind,
      start: fields.start,
      end: fields.end,
      allDay: fields.allDay,
    });
    calendarRef.current?.getApi().unselect();
  }

  function openNewEvent() {
    const { start, end } = quarterHourSlot(new Date());
    calendarRef.current?.getApi().unselect();
    openComposer({
      title: "",
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
      kind: "event",
      taskId: "",
    });
  }

  return (
    <div
      ref={rootRef}
      className="todex-calendar flex min-h-0 flex-1 flex-col"
      data-draft-kind={draft?.kind}
      data-calendar-mode={mode}
      style={{ ["--todex-day-count" as string]: String(dayCountForGrid) }}
    >
      <CalendarToolbar
        rangeFrom={range.from}
        rangeTo={range.to}
        onPrevious={() => calendarRef.current?.getApi().prev()}
        onNext={() => calendarRef.current?.getApi().next()}
        onToday={() => calendarRef.current?.getApi().gotoDate(new Date())}
        onNew={openNewEvent}
      />
      <div ref={gridRef} className="relative min-h-0 flex-1 px-2 pb-2">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView={CALENDAR_VIEW_BY_DAY_COUNT[dayCount] ?? "timeGridRollingWeek"}
          headerToolbar={false}
          height="100%"
          nowIndicator
          selectable
          selectMirror={false}
          selectMinDistance={0}
          unselectCancel=".calendar-draft,.calendar-event-preview,[data-radix-popper-content-wrapper]"
          droppable
          editable
          eventResizableFromStart
          eventDurationEditable
          slotEventOverlap={false}
          firstDay={1}
          slotDuration="00:30:00"
          snapDuration="00:15:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
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
            backgroundColor: "transparent",
            borderColor: "transparent",
            textColor: "var(--foreground)",
            editable: !block.readOnly,
            classNames: chipClassNames(block),
            extendedProps: block,
          }))}
          dayHeaderContent={(arg) => (
            <DayHeader date={arg.date} isToday={arg.isToday} mode={mode} />
          )}
          nowIndicatorContent={(arg) =>
            arg.isAxis ? <span className="todex-now-pill">{formatClock(arg.date, false)}</span> : null
          }
          eventContent={(arg) => <CalendarChip arg={arg} />}
          datesSet={(arg) => {
            rememberRange(arg, setRange);
            const axis = rootRef.current?.querySelector(
              ".fc-col-header .fc-timegrid-axis",
            );
            if (axis) axis.textContent = shortZoneName();
          }}
          select={(selection) => {
            const frame = gridRef.current;
            if (!frame) return;
            const keep = keepDraftFields.current;
            keepDraftFields.current = false;
            if (!keep) {
              setDraftSession((session) => session + 1);
              setPreview(null);
            }
            const point = selection.jsEvent;
            const openDraft = () => {
              const origin = selectionOrigin(frame, point);
              draftOriginRef.current = origin;
              const anchor = menuAnchor(frame, origin, DRAFT_MENU_WIDTH, DRAFT_MENU_HEIGHT);
              setDraft((current) => ({
                start: selection.start,
                end: selection.end,
                allDay: selection.allDay,
                kind: keep && current ? current.kind : "event",
                left: anchor.left,
                top: anchor.top,
                maxHeight: anchor.maxHeight,
              }));
            };
            if (point) openDraft();
            else requestAnimationFrame(openDraft);
          }}
          unselect={() => {
            if (keepDraftFields.current) return;
            setDraft(null);
          }}
          eventClick={(arg) => {
            const block = arg.event.extendedProps as CalendarBlock;
            calendarRef.current?.getApi().unselect();
            if (block.kind === "session" && block.sessionId) {
              setPreview(null);
              openSession(block.sessionId);
              return;
            }
            if (block.kind === "task") {
              setPreview(null);
              openBlock(arg, openEvent, openTask);
              return;
            }
            const frame = gridRef.current;
            if (!frame || !block.eventId) return;
            const rect = arg.el.getBoundingClientRect();
            const anchor = menuAnchor(
              frame,
              { x: rect.right, top: rect.top, bottom: rect.bottom },
              DRAFT_MENU_WIDTH,
              380,
            );
            setPreview({
              block,
              left: anchor.left,
              top: anchor.top,
              maxHeight: anchor.maxHeight,
            });
          }}
          eventsSet={() => {
            scheduleRepaintTimegridOverlapLayout(rootRef.current, blocksRef.current, modeRef.current);
          }}
          eventDidMount={(arg) => {
            stampHarnessEvent(arg.el, arg.event.id);
            scheduleRepaintTimegridOverlapLayout(rootRef.current, blocksRef.current, modeRef.current);
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
            const duration = end.getTime() - start.getTime();
            if (!arg.event.allDay && duration < 15 * 60 * 1000) return;
            void createEvent({
              title,
              start: start.toISOString(),
              end: end.toISOString(),
              allDay: arg.event.allDay,
              timeZone,
              spaceId: (arg.event.extendedProps.spaceId as string | null | undefined) ?? null,
              description:
                (arg.event.extendedProps.description as string | undefined) ?? "",
              taskScope:
                (arg.event.extendedProps.taskScope as string[] | undefined) ?? [],
            });
          }}
        />
        {draft ? (
          <CalendarDraft
            ref={draftFormRef}
            key={draftSession}
            draft={draft}
            tasks={tasks}
            boards={boards}
            onKind={(kind) =>
              setDraft((current) => (current ? { ...current, kind } : current))
            }
            onRange={(start, end) => {
              keepDraftFields.current = true;
              calendarRef.current?.getApi().select(start, end);
              keepDraftFields.current = false;
            }}
            onCancel={() => calendarRef.current?.getApi().unselect()}
            onMore={(fields) => openFullEditor(fields)}
            onCreate={async (body) => {
              if (body.kind === "task") {
                await updateTask(body.taskId, {
                  scheduleDate: body.scheduleDate,
                  ...(body.estimation != null
                    ? { estimation: body.estimation }
                    : {}),
                });
              } else {
                await createEvent({
                  title: body.title,
                  start: body.start,
                  end: body.end,
                  allDay: body.allDay,
                  timeZone,
                });
              }
              calendarRef.current?.getApi().unselect();
            }}
          />
        ) : null}
        {preview ? (
          <CalendarEventPreview
            key={preview.block.key}
            preview={preview}
            onClose={() => setPreview(null)}
            onMore={() => {
              const block = preview.block;
              if (block.eventId) openEvent(block.eventId, block.originalStart);
              setPreview(null);
            }}
            onSave={async (body) => {
              const block = preview.block;
              if (!block.eventId) return;
              await updateEvent(block.eventId, {
                ...body,
                ...(block.series && block.originalStart
                  ? { scope: "instance", originalStart: block.originalStart }
                  : { scope: "series" }),
              });
              setPreview(null);
            }}
            onRsvp={(status) => {
              const block = preview.block;
              if (!block.eventId) return;
              const next = block.rsvpStatus === status ? null : status;
              setPreview((current) =>
                current
                  ? { ...current, block: { ...current.block, rsvpStatus: next } }
                  : current,
              );
              void updateEvent(block.eventId, {
                rsvpStatus: next,
                ...(block.series && block.originalStart
                  ? { scope: "instance", originalStart: block.originalStart }
                  : {}),
              });
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function DayHeader({
  date,
  isToday,
  mode,
}: {
  date: Date;
  isToday: boolean;
  mode: "planned" | "actual" | "both";
}) {
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  return (
    <span className="flex w-full flex-col items-stretch gap-1">
      <span className="flex w-full justify-center">
        <span
          className={
            isToday
              ? "todex-day-pill inline-flex items-center gap-1 rounded-full px-2 py-0.5"
              : "inline-flex items-center gap-1 text-muted-foreground"
          }
        >
          <span className="font-medium">{weekday}</span>
          <span>{date.getDate()}</span>
        </span>
      </span>
      {mode === "both" ? (
        <span className="relative grid w-full grid-cols-2 text-[10px] font-medium text-muted-foreground">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border"
          />
          <span className="text-center">Planned</span>
          <span className="text-center">Actual</span>
        </span>
      ) : null}
    </span>
  );
}

function CalendarChip({ arg }: { arg: EventContentArg }) {
  const block = arg.event.extendedProps as CalendarBlock;
  const start = arg.event.start;
  const end = arg.event.end;
  const time =
    !arg.event.allDay && start && end ? formatChipRange(start, end) : null;
  const Icon = block.kind === "event" ? CalendarIcon : TasksIcon;
  return (
    <div
      className="fc-event-main-frame todex-cal-event-inner"
      style={{ ["--todex-block-color" as string]: block.color }}
      {...overlapStamp(block)}
    >
      <Icon size={11} className="todex-cal-secondary mt-0.5 shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="todex-cal-title text-[10px] font-medium leading-tight">
          {arg.event.title}
        </span>
        {time ? (
          <span className="todex-cal-time todex-cal-secondary text-[9px] tabular-nums leading-tight">
            {time}
          </span>
        ) : null}
      </span>
    </div>
  );
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
  if (!arg.event.allDay && end.getTime() - start.getTime() < 15 * 60 * 1000) {
    arg.revert();
    return;
  }
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
  if (!arg.event.allDay && end.getTime() - start.getTime() < 15 * 60 * 1000) {
    arg.revert();
    return;
  }
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

function formatClock(date: Date, hour12: boolean) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  }).format(date);
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
  origin: SelectionOrigin,
  menuWidth: number,
  menuHeight: number,
) {
  const rect = frame.getBoundingClientRect();
  const left = clamp(
    origin.x - rect.left,
    MENU_GAP,
    Math.max(MENU_GAP, rect.width - menuWidth - MENU_GAP),
  );
  const aboveEdge = clamp(origin.top - rect.top, 0, rect.height);
  const belowEdge = clamp(origin.bottom - rect.top, 0, rect.height);
  const spaceAbove = aboveEdge - MENU_GAP;
  const spaceBelow = rect.height - belowEdge - MENU_GAP;
  const placeBelow = spaceBelow >= menuHeight || spaceBelow >= spaceAbove;
  const maxHeight = Math.max(
    0,
    Math.min(menuHeight, placeBelow ? spaceBelow : spaceAbove),
  );
  const top = clamp(
    placeBelow ? belowEdge + MENU_GAP : aboveEdge - MENU_GAP - maxHeight,
    0,
    Math.max(0, rect.height - maxHeight),
  );
  return { left, top, maxHeight };
}

function selectionOrigin(
  frame: HTMLElement,
  point: { clientX: number; clientY: number } | null,
): SelectionOrigin {
  const highlight = frame.querySelector(".fc-highlight")?.getBoundingClientRect();
  if (highlight && highlight.width > 0 && highlight.height > 0) {
    return { x: highlight.right, top: highlight.top, bottom: highlight.bottom };
  }
  if (point) {
    return { x: point.clientX, top: point.clientY, bottom: point.clientY };
  }
  const rect = frame.getBoundingClientRect();
  return {
    x: rect.left + 96,
    top: rect.top + 96,
    bottom: rect.top + 96,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function chipClassNames(block: CalendarBlock) {
  return [
    "todex-cal-chip",
    block.kind === "task" ? "todex-cal-task" : "",
    block.kind === "session" ? "todex-cal-session" : "",
    block.rsvpStatus === "no" ? "todex-cal-rsvp-no" : "",
    block.rsvpStatus === "maybe" ? "todex-cal-rsvp-maybe" : "",
  ].filter(Boolean);
}

function quarterHourSlot(now: Date) {
  const start = new Date(now);
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() - (start.getMinutes() % 15));
  return { start, end: new Date(start.getTime() + 15 * 60 * 1000) };
}

function scrollTime(): string {
  const now = new Date();
  const hour = Math.max(0, now.getHours() - 2);
  return `${String(hour).padStart(2, "0")}:00:00`;
}

const CALENDAR_VIEW_BY_DAY_COUNT: Record<number, string> = {
  1: "timeGridDay",
  2: "timeGridTwoDay",
  3: "timeGridThreeDay",
  4: "timeGridFourDay",
  5: "timeGridFiveDay",
  6: "timeGridSixDay",
  7: "timeGridRollingWeek",
};

const CALENDAR_VIEWS = {
  timeGridTwoDay: { type: "timeGrid", duration: { days: 2 }, dateAlignment: "day" },
  timeGridThreeDay: { type: "timeGrid", duration: { days: 3 }, dateAlignment: "day" },
  timeGridFourDay: { type: "timeGrid", duration: { days: 4 }, dateAlignment: "day" },
  timeGridFiveDay: { type: "timeGrid", duration: { days: 5 }, dateAlignment: "day" },
  timeGridSixDay: { type: "timeGrid", duration: { days: 6 }, dateAlignment: "day" },
  timeGridRollingWeek: {
    type: "timeGrid",
    duration: { days: 7 },
    dateAlignment: "day",
  },
} as const;

const MENU_GAP = 8;
const DRAFT_MENU_WIDTH = 352;
const DRAFT_MENU_HEIGHT = 280;

interface SelectionOrigin {
  x: number;
  top: number;
  bottom: number;
}
