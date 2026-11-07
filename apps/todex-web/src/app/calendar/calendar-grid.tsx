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

import { blocksForRange, visibleBlocks, type CalendarBlock } from "./calendar-blocks";
import { blockColor, fillIsLight } from "./calendar-colors";
import { deviceTimeZone } from "./calendar-datetime";
import {
  ensureTimegridOverlapLayoutObserver,
  overlapStamp,
  scheduleRepaintTimegridOverlapLayout,
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
  const [viewId, setViewId] = useState("timeGridRollingWeek");
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
    state: { events, tasks, boards, range, visibility, focusRequest, previews },
    actions: { setRange, openEvent, openTask, openComposer, createEvent, updateEvent, updateTask },
  } = useCalendar();
  const blocks = useMemo(
    () =>
      visibleBlocks(
        blocksForRange(
          events,
          tasks,
          new Date(range.from),
          new Date(range.to),
          previews,
        ),
        visibility,
      ),
    [events, tasks, previews, range.from, range.to, visibility],
  );
  const timeZone = deviceTimeZone();

  useEffect(() => {
    if (!focusRequest) return;
    calendarRef.current?.getApi().gotoDate(focusRequest.date);
  }, [focusRequest]);

  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  useEffect(() => {
    ensureTimegridOverlapLayoutObserver(rootRef.current, () => blocksRef.current);
  }, []);

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
    scheduleRepaintTimegridOverlapLayout(rootRef.current, blocks);
  }, [blocks]);

  const dayCount = DAY_COUNT[viewId] ?? 7;

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
      style={{ ["--todex-day-count" as string]: String(dayCount) }}
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
          initialView="timeGridRollingWeek"
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
          slotEventOverlap
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
            backgroundColor: blockColor(
              block.kind === "event" ? "event" : "task",
              block.color,
            ),
            borderColor: "transparent",
            editable: !block.readOnly,
            classNames: chipClassNames(block),
            extendedProps: block,
          }))}
          dayHeaderContent={(arg) => (
            <DayHeader date={arg.date} isToday={arg.isToday} />
          )}
          nowIndicatorContent={(arg) =>
            arg.isAxis ? <span className="todex-now-pill">{formatClock(arg.date, false)}</span> : null
          }
          eventContent={(arg) => <CalendarChip arg={arg} hour12={false} />}
          datesSet={(arg) => {
            setViewId(arg.view.type);
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
            scheduleRepaintTimegridOverlapLayout(rootRef.current, blocksRef.current);
          }}
          eventDidMount={() => {
            scheduleRepaintTimegridOverlapLayout(rootRef.current, blocksRef.current);
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
              void updateTask(taskId, {
                startAt: start.toISOString(),
                endAt: end.toISOString(),
              });
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
                  startAt: body.startAt,
                  endAt: body.endAt,
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

function DayHeader({ date, isToday }: { date: Date; isToday: boolean }) {
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums">
      <span className="font-medium text-muted-foreground">{weekday}</span>
      <span className={isToday ? "text-foreground" : undefined}>{date.getDate()}</span>
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
  if (block.kind === "preview") return;
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
    patch: { slotId?: string | null; startAt?: string; endAt?: string },
  ) => Promise<unknown>,
) {
  const block = arg.event.extendedProps as {
    kind?: string;
    eventId?: string | null;
    taskId?: string | null;
    slotId?: string | null;
    originalStart?: string | null;
    series?: boolean;
  };
  const start = arg.event.start;
  const end = arg.event.end;
  if (!start || !end) return arg.revert();
  try {
    if (block.kind === "task" && block.taskId) {
      await updateTask(block.taskId, {
        slotId: block.slotId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
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

async function resizeBlock(
  arg: EventResizeDoneArg,
  updateEvent: (eventId: string, body: unknown) => Promise<unknown>,
  updateTask: (
    taskId: string,
    patch: { slotId?: string | null; startAt?: string; endAt?: string },
  ) => Promise<unknown>,
) {
  const block = arg.event.extendedProps as {
    kind?: string;
    eventId?: string | null;
    taskId?: string | null;
    slotId?: string | null;
    originalStart?: string | null;
    series?: boolean;
  };
  const start = arg.event.start;
  const end = arg.event.end;
  if (!start || !end) return arg.revert();
  try {
    if (block.kind === "task" && block.taskId) {
      await updateTask(block.taskId, {
        slotId: block.slotId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
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
  const fill = blockColor(block.kind === "event" ? "event" : "task", block.color);
  return [
    "todex-cal-chip",
    block.kind === "task" || block.kind === "preview" ? "todex-cal-task" : "",
    block.kind === "preview" ? "opacity-50" : "",
    fillIsLight(fill) ? "todex-cal-light" : "",
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

const DAY_COUNT: Record<string, number> = {
  timeGridDay: 1,
  timeGridTwoDay: 2,
  timeGridThreeDay: 3,
  timeGridFourDay: 4,
  timeGridFiveDay: 5,
  timeGridRollingWeek: 7,
};

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

const MENU_GAP = 8;
const DRAFT_MENU_WIDTH = 352;
const DRAFT_MENU_HEIGHT = 280;

interface SelectionOrigin {
  x: number;
  top: number;
  bottom: number;
}
