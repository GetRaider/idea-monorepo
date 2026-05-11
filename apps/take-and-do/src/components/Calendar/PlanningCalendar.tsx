"use client";

import type {
  DateSelectArg,
  DatesSetArg,
  DayHeaderContentArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  EventInput,
  NowIndicatorContentArg,
  NowIndicatorMountArg,
  SlotLabelContentArg,
  ViewMountArg,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  Draggable,
  type EventReceiveArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { createRoot, type Root } from "react-dom/client";
import type { CSSProperties } from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CalendarAxisTimeZone,
  CalendarBacklogEvent,
  CalendarEvent,
  CalendarEventType,
  CalendarKindVisibility,
} from "@/types/calendar.types";

import { cn } from "@/lib/styles/utils";

import { CalendarAxisCorner } from "./CalendarAxisCorner";
import { formatAxisSlotTime } from "./calendar-axis-time";
import { CalendarPlanningToolbar } from "./CalendarPlanningToolbar";
import {
  extendedPropsToKind,
  fcEventRangeToScheduledPatch,
  kindColor,
  kindLabel,
  scheduledToEventInput,
} from "./calendar-event-mapper";
import { CalendarKindIcon, calendarKindIconSizePx } from "./CalendarKindIcon";
import "./calendar-theme.css";

const CUSTOM_VIEWS = {
  timeGridTwoDay: {
    type: "timeGrid" as const,
    duration: { days: 2 },
    buttonText: "2d",
  },
  timeGridThreeDay: {
    type: "timeGrid" as const,
    duration: { days: 3 },
    buttonText: "3d",
  },
  timeGridFourDay: {
    type: "timeGrid" as const,
    duration: { days: 4 },
    buttonText: "4d",
  },
  timeGridFiveDay: {
    type: "timeGrid" as const,
    duration: { days: 5 },
    buttonText: "5d",
  },
};

const DEFAULT_KIND_VISIBILITY: CalendarKindVisibility = {
  timeBlock: true,
  common: true,
  task: true,
};

export type PlanningCalendarHandle = {
  goToDate: (d: Date) => void;
  clearSelection: () => void;
};

interface PlanningCalendarProps {
  events: CalendarEvent[];
  backlog: CalendarBacklogEvent[];
  backlogContainerRef: React.RefObject<HTMLDivElement | null>;
  visibleKinds?: CalendarKindVisibility;
  onSelectRange: (
    start: Date,
    end: Date,
    allDay: boolean,
    anchor: { clientX: number; clientY: number },
    anchorRect?: DOMRect,
  ) => void;
  onEventClick: (
    event: CalendarEvent,
    anchor: { clientX: number; clientY: number },
    anchorRect?: DOMRect,
  ) => void;
  onEventReceive: (event: CalendarEvent) => void;
  onEventTimesUpdated: (
    id: string,
    patch: Pick<CalendarEvent, "start" | "end" | "allDay">,
  ) => void;
  /** While creating an event, keep FullCalendar’s selection highlight in sync. */
  draftSelectionHighlight?: {
    start: Date;
    endExclusive: Date;
    allDay: boolean;
  } | null;
  draftSelectionVersion?: number;
  /** While the draft quick menu is open, tints selection + mirror to match this kind. */
  draftSelectionKind?: CalendarEventType | null;
  slotTime24h: boolean;
  onSlotTime24hChange: (next: boolean) => void;
  axisTimeZones: CalendarAxisTimeZone[];
  onAxisTimeZonesChange: (next: CalendarAxisTimeZone[]) => void;
}

function isEventKind(value: unknown): value is CalendarEventType {
  return value === "timeBlock" || value === "common" || value === "task";
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatNowHm(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Matches slot-axis time style (12h compact, same as pill). */
function formatGridClock(d: Date, use24h: boolean) {
  if (use24h) return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const h24 = d.getHours();
  const m = pad2(d.getMinutes());
  const h12 = h24 % 12 || 12;
  const ap = h24 >= 12 ? "pm" : "am";
  return `${h12}:${m}${ap}`;
}

/** Same window as “start only” time subtitle — ~15m timed blocks are one shallow row in the grid. */
const SHORT_TIMED_ONE_LINE_MS = 15 * 60 * 1000 + 250;

function formatEventTimeSubtitle(
  start: Date,
  end: Date | null,
  use24h: boolean,
  durMs: number,
) {
  if (!end || Number.isNaN(end.getTime())) return "";
  const onlyStart = durMs > 0 && durMs <= SHORT_TIMED_ONE_LINE_MS;
  if (onlyStart) return formatGridClock(start, use24h);
  return `${formatGridClock(start, use24h)}–${formatGridClock(end, use24h)}`;
}

function dayHeaderDayWeek(arg: DayHeaderContentArg) {
  const d = arg.date;
  const num = d.getDate();
  const wd = d.toLocaleDateString(undefined, { weekday: "short" });
  return (
    <span
      className={cn(
        "tad-day-header-inner inline-flex items-center gap-0.5 tabular-nums",
        arg.isToday && "tad-day-header-inner--today",
      )}
    >
      <span className="font-semibold text-zinc-100">{num}</span>
      <span className="text-zinc-400">{wd}</span>
    </span>
  );
}

export const PlanningCalendar = forwardRef<
  PlanningCalendarHandle,
  PlanningCalendarProps
>(function PlanningCalendar(
  {
    events,
    backlog,
    backlogContainerRef,
    visibleKinds = DEFAULT_KIND_VISIBILITY,
    onSelectRange,
    onEventClick,
    onEventReceive,
    onEventTimesUpdated,
    draftSelectionHighlight = null,
    draftSelectionVersion = 0,
    draftSelectionKind = null,
    slotTime24h,
    onSlotTime24hChange,
    axisTimeZones,
    onAxisTimeZonesChange,
  },
  ref,
) {
  const fcRef = useRef<FullCalendar>(null);
  const fcContainerRef = useRef<HTMLDivElement>(null);
  const axisCornerRootRef = useRef<Root | null>(null);
  const axisCornerHostRef = useRef<HTMLElement | null>(null);
  /** Prevents `api.select()` from re-entering `select` → `onSelectRange` → setState loop. */
  const applyingProgrammaticSelectRef = useRef(false);
  const [activeViewType, setActiveViewType] = useState("timeGridWeek");
  /** FC renders the line only in today’s cell; width = span × column so it reaches the rest of the view. */
  const [nowLineSpan, setNowLineSpan] = useState(7);
  /** Pixel width avoids % resolution bugs (line starting one column late) inside table/positioned cells. */
  const [nowLineWidthPx, setNowLineWidthPx] = useState<number | null>(null);
  const [toolbarMeta, setToolbarMeta] = useState<{
    headline: string;
    rangeLabel: string;
    badgeMonth: string;
    badgeDay: string;
  } | null>(null);

  const slotLabelFormat = useMemo(
    () =>
      slotTime24h
        ? ({ hour: "2-digit", minute: "2-digit", hour12: false } as const)
        : ({
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
            omitZeroMinute: true,
          } as const),
    [slotTime24h],
  );

  const formatNowForPill = useCallback(
    (d: Date) => {
      if (slotTime24h) return formatNowHm(d);
      const h24 = d.getHours();
      const m = pad2(d.getMinutes());
      const h12 = h24 % 12 || 12;
      const ap = h24 >= 12 ? "pm" : "am";
      return `${h12}:${m} ${ap}`;
    },
    [slotTime24h],
  );

  const nowIndicatorContent = useCallback(
    (arg: NowIndicatorContentArg) => {
      if (arg.isAxis) {
        return (
          <span className="tad-now-indicator-pill">
            {formatNowForPill(arg.date)}
          </span>
        );
      }
      return null;
    },
    [formatNowForPill],
  );

  const zoneCount = axisTimeZones.length;

  const slotLabelContent = useCallback(
    (arg: SlotLabelContentArg) => {
      if (arg.level !== 0) return arg.text;
      const d = arg.date;
      // No label on the day-start line (like no "24:00" at the bottom); grid line stays.
      if (d.getHours() === 0 && d.getMinutes() === 0) {
        return null;
      }
      return (
        <div
          className="tad-slot-tz-row"
          style={{
            gridTemplateColumns: `repeat(${zoneCount}, minmax(2.75rem, max-content))`,
          }}
        >
          {axisTimeZones.map((z) => (
            <span key={z.id} className="tad-slot-tz-row__cell">
              {formatAxisSlotTime(d, z, slotTime24h)}
            </span>
          ))}
        </div>
      );
    },
    [axisTimeZones, zoneCount, slotTime24h],
  );

  const renderAxisCornerIntoFrame = useCallback(() => {
    const rootEl = fcContainerRef.current;
    if (!rootEl) return;
    const frame = rootEl.querySelector(
      ".fc-scrollgrid-section-header .fc-timegrid-axis .fc-timegrid-axis-frame",
    );
    if (!(frame instanceof HTMLElement)) return;

    if (axisCornerHostRef.current !== frame) {
      axisCornerRootRef.current?.unmount();
      axisCornerRootRef.current = null;
      axisCornerHostRef.current = frame;
    }

    if (!axisCornerRootRef.current) {
      axisCornerRootRef.current = createRoot(frame);
    }

    axisCornerRootRef.current.render(
      <CalendarAxisCorner
        zones={axisTimeZones}
        onZonesChange={onAxisTimeZonesChange}
      />,
    );
  }, [axisTimeZones, onAxisTimeZonesChange]);

  const syncTimeAxisCorner = useCallback(() => {
    renderAxisCornerIntoFrame();
  }, [renderAxisCornerIntoFrame]);

  const measureNowLineGeometry = useCallback(
    (viewType?: string) => {
      const root = fcContainerRef.current;
      const vt = viewType ?? activeViewType;
      if (!vt.startsWith("timeGrid")) {
        setNowLineSpan(1);
        setNowLineWidthPx(null);
        return;
      }
      if (!root) return;

      const colsRoot = root.querySelector(".fc-timegrid-cols");
      if (!colsRoot) {
        setNowLineSpan(1);
        setNowLineWidthPx(null);
        return;
      }

      const lineEl = colsRoot.querySelector(".fc-timegrid-now-indicator-line");
      const todayTd =
        lineEl?.closest("td.fc-timegrid-col") ??
        colsRoot.querySelector("td.fc-day-today.fc-timegrid-col");

      if (!(todayTd instanceof HTMLElement)) {
        setNowLineSpan(1);
        setNowLineWidthPx(null);
        return;
      }

      const row = todayTd.closest("tr");
      if (!row) {
        setNowLineSpan(1);
        setNowLineWidthPx(null);
        return;
      }

      const dayCells = Array.from(
        row.querySelectorAll("td.fc-timegrid-col:not(.fc-timegrid-axis)"),
      ) as HTMLElement[];
      const idx = dayCells.indexOf(todayTd);
      const n = dayCells.length;
      const span = idx >= 0 && n > 0 ? n - idx : 1;
      setNowLineSpan(span);

      let totalWidthPx = 0;
      if (idx >= 0) {
        for (let i = idx; i < n; i++) {
          totalWidthPx += dayCells[i].getBoundingClientRect().width;
        }
      } else {
        const frame = todayTd.querySelector(".fc-timegrid-col-frame");
        const w =
          frame?.getBoundingClientRect().width ??
          todayTd.getBoundingClientRect().width;
        totalWidthPx = w * span;
      }

      setNowLineWidthPx(Math.round(totalWidthPx * 1000) / 1000);
    },
    [activeViewType],
  );

  const handleNowIndicatorDidMount = useCallback(
    (arg: NowIndicatorMountArg) => {
      if (arg.isAxis) return;
      requestAnimationFrame(() => {
        measureNowLineGeometry();
      });
    },
    [measureNowLineGeometry],
  );

  useLayoutEffect(() => {
    renderAxisCornerIntoFrame();
  }, [renderAxisCornerIntoFrame]);

  useEffect(() => {
    return () => {
      axisCornerRootRef.current?.unmount();
      axisCornerRootRef.current = null;
      axisCornerHostRef.current = null;
    };
  }, []);

  const handleViewDidMount = useCallback(
    (arg: ViewMountArg) => {
      if (!arg.view.type.startsWith("timeGrid")) return;
      requestAnimationFrame(() => {
        syncTimeAxisCorner();
        requestAnimationFrame(() => {
          measureNowLineGeometry(arg.view.type);
        });
      });
    },
    [syncTimeAxisCorner, measureNowLineGeometry],
  );

  const handleViewWillUnmount = useCallback((arg: ViewMountArg) => {
    if (!arg.view.type.startsWith("timeGrid")) return;
    axisCornerRootRef.current?.unmount();
    axisCornerRootRef.current = null;
    axisCornerHostRef.current = null;
  }, []);

  useImperativeHandle(ref, () => ({
    goToDate: (d: Date) => {
      fcRef.current?.getApi().gotoDate(d);
    },
    clearSelection: () => {
      fcRef.current?.getApi().unselect();
    },
  }));

  const getApi = useCallback(() => fcRef.current?.getApi() ?? null, []);

  const fcEvents: EventInput[] = useMemo(() => {
    const filtered = events.filter((e) => visibleKinds[e.type]);
    return filtered.map(scheduledToEventInput);
  }, [events, visibleKinds]);

  const findBacklogItem = useCallback(
    (id: string | null) =>
      id ? (backlog.find((b) => b.id === id) ?? null) : null,
    [backlog],
  );

  useEffect(() => {
    const el = backlogContainerRef.current;
    if (!el) return;

    const draggable = new Draggable(el, {
      itemSelector: ".calendar-backlog-draggable",
      eventData: (dragEl) => {
        const id = dragEl.getAttribute("data-backlog-id");
        const item = findBacklogItem(id);
        if (!item) {
          return { title: "Event", duration: { minutes: 60 } };
        }
        return {
          title: item.title,
          duration: { minutes: item.durationMinutes },
          extendedProps: {
            kind: item.type,
            taskScope: item.taskScope,
          },
        };
      },
    });

    return () => draggable.destroy();
  }, [backlogContainerRef, findBacklogItem, backlog]);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      setActiveViewType(arg.view.type);
      const rangeStart = arg.start;
      const rangeEndExclusive = arg.end;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inView = today >= rangeStart && today < rangeEndExclusive;
      const badgeBase = inView ? today : rangeStart;
      const monthNum = String(badgeBase.getMonth() + 1);
      const monthLong = badgeBase.toLocaleDateString(undefined, {
        month: "long",
      });
      const yearNum = badgeBase.getFullYear();
      setToolbarMeta({
        headline: `${monthLong} (${monthNum}) ${yearNum}`,
        rangeLabel: arg.view.title,
        badgeMonth: badgeBase
          .toLocaleDateString(undefined, { month: "short" })
          .toUpperCase(),
        badgeDay: String(badgeBase.getDate()),
      });

      if (arg.view.type.startsWith("timeGrid")) {
        requestAnimationFrame(() => {
          syncTimeAxisCorner();
          requestAnimationFrame(() => {
            measureNowLineGeometry(arg.view.type);
          });
        });
      } else {
        setNowLineSpan(1);
        setNowLineWidthPx(null);
      }
    },
    [syncTimeAxisCorner, measureNowLineGeometry],
  );

  useLayoutEffect(() => {
    if (!activeViewType.startsWith("timeGrid")) return;
    const root = fcContainerRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => {
      measureNowLineGeometry();
    });
    ro.observe(root);
    measureNowLineGeometry();
    return () => ro.disconnect();
  }, [activeViewType, toolbarMeta?.rangeLabel, measureNowLineGeometry]);

  const handleSelect = useCallback(
    (arg: DateSelectArg) => {
      if (applyingProgrammaticSelectRef.current) return;
      const start = arg.start;
      const end = arg.end;
      if (!start || !end) return;
      const x = arg.jsEvent?.clientX ?? window.innerWidth / 2;
      const y = arg.jsEvent?.clientY ?? 140;
      const target = (arg.jsEvent?.target as HTMLElement | null) ?? null;
      const cell =
        target?.closest?.(
          ".fc-timegrid-slot, .fc-timegrid-col, .fc-daygrid-day, .fc-daygrid-day-frame",
        ) ?? target;
      const rect = cell?.getBoundingClientRect?.();
      onSelectRange(start, end, arg.allDay, { clientX: x, clientY: y }, rect);
    },
    [onSelectRange],
  );

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const id = info.event.id;
      const found = events.find((e) => e.id === id);
      if (!found) return;
      info.jsEvent.preventDefault();
      onEventClick(
        found,
        {
          clientX: info.jsEvent.clientX,
          clientY: info.jsEvent.clientY,
        },
        info.el.getBoundingClientRect(),
      );
    },
    [events, onEventClick],
  );

  const handleReceive = useCallback(
    (info: EventReceiveArg) => {
      const ev = info.event;
      const start = ev.start;
      const end = ev.end;
      if (!start || !end) {
        ev.remove();
        return;
      }
      const rawKind = ev.extendedProps.kind;
      const kind: CalendarEventType = isEventKind(rawKind)
        ? extendedPropsToKind(rawKind)
        : "timeBlock";
      const safeKind: Exclude<CalendarEventType, "task"> =
        kind === "task" ? "timeBlock" : kind;
      const taskScope = ev.extendedProps.taskScope;

      const scheduled: CalendarEvent = {
        id: crypto.randomUUID(),
        type: safeKind,
        title: ev.title || "Untitled",
        start: start.toISOString(),
        end: end.toISOString(),
        allDay: ev.allDay,
        ...(safeKind === "timeBlock" && Array.isArray(taskScope)
          ? { taskScope }
          : {}),
      };
      ev.remove();
      onEventReceive(scheduled);
    },
    [onEventReceive],
  );

  const handleDrop = useCallback(
    (info: EventDropArg) => {
      const patch = fcEventRangeToScheduledPatch(info.event);
      if (!patch) return;
      onEventTimesUpdated(info.event.id, patch);
    },
    [onEventTimesUpdated],
  );

  const handleResize = useCallback(
    (info: EventResizeDoneArg) => {
      const patch = fcEventRangeToScheduledPatch(info.event);
      if (!patch) return;
      onEventTimesUpdated(info.event.id, patch);
    },
    [onEventTimesUpdated],
  );

  useLayoutEffect(() => {
    const api = fcRef.current?.getApi();
    if (!api || !draftSelectionHighlight) return;
    applyingProgrammaticSelectRef.current = true;
    try {
      api.select({
        start: draftSelectionHighlight.start,
        end: draftSelectionHighlight.endExclusive,
        allDay: draftSelectionHighlight.allDay,
      });
    } finally {
      applyingProgrammaticSelectRef.current = false;
    }
  }, [draftSelectionHighlight, draftSelectionVersion]);

  return (
    <div
      className="take-and-do-calendar calendar-surface flex min-h-0 flex-1 flex-col overflow-hidden"
      data-draft-kind={draftSelectionKind ?? undefined}
      style={
        {
          "--tad-now-line-span": String(nowLineSpan),
          ...(nowLineWidthPx != null
            ? { "--tad-now-line-width-px": `${nowLineWidthPx}px` }
            : {}),
          "--tad-axis-zone-count": String(zoneCount),
          ...(draftSelectionKind
            ? { "--draft-kind-color": kindColor(draftSelectionKind) }
            : {}),
        } as CSSProperties
      }
    >
      <CalendarPlanningToolbar
        getApi={getApi}
        activeViewType={activeViewType}
        toolbarMeta={toolbarMeta}
        slotTime24h={slotTime24h}
        onSlotTime24hChange={onSlotTime24hChange}
      />
      <div ref={fcContainerRef} className="min-h-0 flex-1 overflow-hidden">
        <FullCalendar
          ref={fcRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          views={CUSTOM_VIEWS}
          headerToolbar={false}
          initialView="timeGridWeek"
          firstDay={1}
          editable
          eventResizableFromStart
          selectable
          selectMirror={false}
          selectLongPressDelay={0}
          selectMinDistance={5}
          slotDuration="00:15:00"
          snapDuration="00:15:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={slotLabelFormat}
          slotLabelContent={slotLabelContent}
          slotEventOverlap
          unselectCancel=".calendar-quick-menu,[data-dropdown-portal]"
          droppable
          nowIndicator
          nowIndicatorContent={nowIndicatorContent}
          nowIndicatorDidMount={handleNowIndicatorDidMount}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          scrollTime="08:00:00"
          dayHeaderContent={dayHeaderDayWeek}
          allDayText="All day"
          allDayContent={({ text }) => (
            <span className="tad-all-day-label">{text}</span>
          )}
          viewDidMount={handleViewDidMount}
          viewWillUnmount={handleViewWillUnmount}
          height="100%"
          events={fcEvents}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          select={handleSelect}
          eventReceive={handleReceive}
          eventDrop={handleDrop}
          eventResize={handleResize}
          eventContent={(arg: EventContentArg) => {
            const isMirror = arg.isMirror;
            const isExistingEventMirror =
              isMirror && (arg.isDragging || arg.isResizing);
            const draftMirrorKind: CalendarEventType | null =
              isMirror && !isExistingEventMirror
                ? (draftSelectionKind ?? "timeBlock")
                : null;

            const kind = isExistingEventMirror
              ? extendedPropsToKind(arg.event.extendedProps.kind)
              : draftMirrorKind
                ? draftMirrorKind
                : extendedPropsToKind(arg.event.extendedProps.kind);
            const taskSnap = arg.event.extendedProps.taskSummarySnapshot as
              | string
              | undefined;
            const start = arg.event.start;
            const end = arg.event.end;
            const durMs = start && end ? end.getTime() - start.getTime() : 0;
            const compactTimed =
              !arg.event.allDay && durMs > 0 && durMs <= 55 * 60 * 1000;
            const shortOneLineTimed =
              !arg.event.allDay &&
              durMs > 0 &&
              durMs <= SHORT_TIMED_ONE_LINE_MS;
            const tip = draftMirrorKind
              ? `${kindLabel(draftMirrorKind)} — New event`
              : `${kindLabel(kind)} — ${arg.event.title}`;
            const iconPx =
              isMirror && !isExistingEventMirror
                ? 10
                : calendarKindIconSizePx(durMs, !!arg.event.allDay);

            const timeSubtitle =
              !arg.event.allDay && start && end
                ? formatEventTimeSubtitle(start, end, slotTime24h, durMs)
                : "";

            const eventTitleBlock = (
              primary: string,
              secondary: string | null,
              extra: string | null,
              padY: "tight" | "normal",
              timeBesideTitle: boolean,
            ) => (
              <div
                className={cn(
                  "fc-event-main-frame tad-planning-event-inner min-h-0 min-w-0",
                  padY === "tight" ? "py-px" : "py-0.5",
                )}
                title={tip}
              >
                <span
                  className="calendar-kind-icon-wrap flex shrink-0 items-center justify-center rounded bg-black/20 p-px"
                  aria-hidden
                >
                  <CalendarKindIcon
                    kind={draftMirrorKind ?? kind}
                    size={Math.min(iconPx, compactTimed ? 10 : 11)}
                    color="rgba(250,250,250,0.95)"
                  />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {timeBesideTitle && secondary ? (
                    <div className="flex min-w-0 items-baseline gap-1">
                      <span className="min-w-0 truncate text-[10px] font-medium leading-tight text-white">
                        {primary}
                      </span>
                      <span className="shrink-0 text-[9px] font-normal leading-none tabular-nums text-zinc-400">
                        {secondary}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="truncate text-[10px] font-medium leading-tight text-white">
                        {primary}
                      </div>
                      {secondary ? (
                        <div className="truncate text-[9px] font-normal leading-tight tabular-nums text-zinc-400">
                          {secondary}
                        </div>
                      ) : null}
                    </>
                  )}
                  {extra ? (
                    <div className="truncate text-[9px] font-normal leading-tight text-zinc-500">
                      {extra}
                    </div>
                  ) : null}
                </div>
              </div>
            );

            const timeBesideTitle = Boolean(timeSubtitle) && shortOneLineTimed;

            if (draftMirrorKind) {
              return eventTitleBlock(
                kindLabel(draftMirrorKind),
                timeSubtitle || null,
                null,
                compactTimed ? "tight" : "normal",
                timeBesideTitle,
              );
            }

            if (compactTimed) {
              return eventTitleBlock(
                arg.event.title,
                timeSubtitle || null,
                null,
                "tight",
                timeBesideTitle,
              );
            }

            return eventTitleBlock(
              arg.event.title,
              timeSubtitle || null,
              taskSnap?.trim() ? taskSnap.trim() : null,
              "normal",
              timeBesideTitle,
            );
          }}
        />
      </div>
    </div>
  );
});

PlanningCalendar.displayName = "PlanningCalendar";
