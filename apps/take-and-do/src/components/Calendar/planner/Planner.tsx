"use client";

import {
  DateSelectArg,
  EventApi,
  EventClickArg,
  EventDropArg,
  EventInput,
  EventMountArg,
  SlotLabelContentArg,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  type EventReceiveArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
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

import {
  type CalendarAxisTimeZone,
  type CalendarBacklogEvent,
  type CalendarEvent,
  type CalendarEventType,
  type CalendarKindVisibility,
  DEFAULT_CALENDAR_KIND_VISIBILITY,
} from "@/types/calendar.types";

import {
  CalendarPlanningToolbar,
  type PlanningTimeGridSlotMinutes,
} from "./Toolbar";
import { formatAxisSlotTime } from "@/helpers/calendar/calendar-axis-time";
import {
  calendarChromeHex,
  effectiveInternalCalendarColor,
  eventFillHex,
  eventUsesCalendarStripe,
} from "@/helpers/calendar/calendar-colors";
import {
  extendedPropsToKind,
  fcEventRangeToScheduledPatch,
  scheduledToEventInput,
  type CalendarEventColorTheme,
} from "@/helpers/calendar/calendar-event-mapper";
import { PLANNING_CALENDAR_CUSTOM_VIEWS } from "@/helpers/calendar/planning-calendar-views";
import { scheduleTadEventRsvpPaint } from "@/helpers/calendar/planning-calendar-event-rsvp";
import { scheduleTadEventStripePaint } from "@/helpers/calendar/planning-calendar-event-stripe";
import {
  applyScheduledEventColorsToFullCalendar,
  planningCalendarEventColorFingerprint,
} from "@/helpers/calendar/planning-calendar-event-colors";
import {
  ensureTimegridOverlapLayoutObserver,
  scheduleRepaintTimegridOverlapLayout,
} from "@/helpers/calendar/planning-calendar-overlap-layout";
import { isPlanningCalendarEventKind } from "@/helpers/calendar/planning-calendar-time-format";
import type { PlanningCalendarToolbarMeta } from "@/helpers/calendar/planning-calendar-toolbar-meta";
import { usePlanningCalendarBacklogDraggable } from "@/hooks/calendar/use-planning-calendar-backlog-draggable";
import { usePlanningCalendarTimeGridChrome } from "@/hooks/calendar/use-planning-calendar-time-grid-chrome";
import "../theme.css";

import { PlanningCalendarDayHeaderContent } from "./DayHeader";
import { PlanningCalendarEventContent } from "./EventContent";

export type PlanningCalendarHandle = {
  goToDate: (d: Date) => void;
  clearSelection: () => void;
  /** Scroll the time grid so wall-clock “now” is near the vertical center of the slot area. */
  scrollNowToCenter: () => void;
  /** Re-measure the grid after the host width changes (e.g. sidebar toggle). */
  notifyLayoutResize: () => void;
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
    revert: () => void,
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
  /** Local kind colors + Google chrome color for event fills / calendar stripes. */
  calendarColorTheme?: CalendarEventColorTheme;
  /** Fired when the grid’s visible date range changes (e.g. navigation / view). */
  onVisibleRangeChange?: (start: Date, endExclusive: Date) => void;
}

export const PlanningCalendar = forwardRef<
  PlanningCalendarHandle,
  PlanningCalendarProps
>(function PlanningCalendar(
  {
    events,
    backlog,
    backlogContainerRef,
    visibleKinds = DEFAULT_CALENDAR_KIND_VISIBILITY,
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
    calendarColorTheme,
    onVisibleRangeChange,
  },
  ref,
) {
  const fcRef = useRef<FullCalendar>(null);
  const fcContainerRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef(events);
  const calendarColorThemeRef = useRef(calendarColorTheme);
  const visibleKindsRef = useRef(visibleKinds);
  eventsRef.current = events;
  calendarColorThemeRef.current = calendarColorTheme;
  visibleKindsRef.current = visibleKinds;
  const toolbarNavShellRef = useRef<HTMLDivElement>(null);
  /** Prevents `api.select()` from re-entering `select` → `onSelectRange` → setState loop. */
  const applyingProgrammaticSelectRef = useRef(false);
  const [toolbarMeta, setToolbarMeta] =
    useState<PlanningCalendarToolbarMeta | null>(null);
  const [timeGridSlotMinutes, setTimeGridSlotMinutes] =
    useState<PlanningTimeGridSlotMinutes>(30);

  const timeGrid = usePlanningCalendarTimeGridChrome({
    fcRef,
    fcContainerRef,
    axisTimeZones,
    onAxisTimeZonesChange,
    slotTime24h,
    setToolbarMeta,
    toolbarRangeLabel: toolbarMeta?.rangeLabel,
    onVisibleRangeChange,
  });

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

  const zoneCount = axisTimeZones.length;

  const slotDurationIso = useMemo(
    () => (timeGridSlotMinutes === 15 ? "00:15:00" : ("00:30:00" as const)),
    [timeGridSlotMinutes],
  );

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

  const getApi = useCallback(() => fcRef.current?.getApi() ?? null, []);

  const playToolbarNavigateAnimation = useCallback(
    (kind: "prev" | "next" | "neutral") => {
      const el = toolbarNavShellRef.current;
      if (!el) return;
      el.style.setProperty(
        "--tad-toolbar-nav-x",
        kind === "prev" ? "-10px" : kind === "next" ? "10px" : "0px",
      );
      const onEnd = () => {
        el.classList.remove("tad-calendar-toolbar-nav-anim");
        el.removeEventListener("animationend", onEnd);
      };
      el.addEventListener("animationend", onEnd);
      el.classList.remove("tad-calendar-toolbar-nav-anim");
      void el.offsetWidth;
      el.classList.add("tad-calendar-toolbar-nav-anim");
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      goToDate: (d: Date) => {
        fcRef.current?.getApi().gotoDate(d);
      },
      clearSelection: () => {
        fcRef.current?.getApi().unselect();
      },
      scrollNowToCenter: () => {
        timeGrid.scrollTimeGridToNowCentered();
      },
      notifyLayoutResize: timeGrid.notifyLayoutResize,
    }),
    [timeGrid],
  );

  const fcEvents: EventInput[] = useMemo(() => {
    const filtered = events.filter((e) => visibleKinds[e.type]);
    return filtered.map((e) => scheduledToEventInput(e, calendarColorTheme));
  }, [events, visibleKinds, calendarColorTheme]);

  const eventColorFingerprint = useMemo(
    () => planningCalendarEventColorFingerprint(events),
    [events],
  );

  /**
   * FullCalendar sometimes skips updating inline `backgroundColor` when theme inputs change.
   * Remount on theme changes only — do not fold the loaded event list into this key: changing
   * views updates the visible range, server sync refetches events, and a new signature would
   * remount the calendar and snap back to `initialView`.
   */
  const fcColorSignature = useMemo(() => {
    const internal = calendarColorTheme?.internalCalendarColor ?? "";
    const google = calendarColorTheme?.googleCalendarColor ?? "";
    return `${internal}|${google}`;
  }, [calendarColorTheme]);

  const prevFcColorSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevFcColorSignatureRef.current;
    prevFcColorSignatureRef.current = fcColorSignature;
    if (prev === null || prev === fcColorSignature) return;
    if (!timeGrid.activeViewType.startsWith("timeGrid")) return;
    requestAnimationFrame(() => {
      timeGrid.syncTimeAxisCorner();
      requestAnimationFrame(() => {
        timeGrid.measureNowLineGeometry(timeGrid.activeViewType);
        timeGrid.scrollTimeGridToNowCentered();
      });
    });
  }, [fcColorSignature, timeGrid]);

  usePlanningCalendarBacklogDraggable(backlogContainerRef, backlog);

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
      const kind: CalendarEventType = isPlanningCalendarEventKind(rawKind)
        ? extendedPropsToKind(rawKind)
        : "timeBlock";
      const taskBoardId = ev.extendedProps.taskBoardId;
      const taskId = ev.extendedProps.taskId;
      const isTaskLinkDrop =
        kind === "task" &&
        typeof taskBoardId === "string" &&
        taskBoardId.length > 0 &&
        typeof taskId === "string" &&
        taskId.length > 0;

      if (isTaskLinkDrop) {
        const snapshotRaw = ev.extendedProps.taskSummarySnapshot;
        const snapshot =
          typeof snapshotRaw === "string" && snapshotRaw.trim().length > 0
            ? snapshotRaw.trim()
            : ev.title || "Task";
        const scheduled: CalendarEvent = {
          id: crypto.randomUUID(),
          type: "task",
          title: ev.title || snapshot,
          start: start.toISOString(),
          end: end.toISOString(),
          allDay: ev.allDay,
          taskBoardId,
          taskId,
          taskSummarySnapshot: snapshot,
        };
        ev.remove();
        onEventReceive(scheduled);
        return;
      }

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

  const scheduleOverlapLayoutRepaint = useCallback((eventApis?: EventApi[]) => {
    scheduleRepaintTimegridOverlapLayout(
      fcContainerRef.current,
      eventsRef.current,
      visibleKindsRef.current,
      eventApis,
    );
  }, []);

  const handleDrop = useCallback(
    (info: EventDropArg) => {
      const patch = fcEventRangeToScheduledPatch(info.event);
      if (!patch) return;
      onEventTimesUpdated(info.event.id, patch, info.revert);
      scheduleOverlapLayoutRepaint(info.view.calendar.getEvents());
    },
    [onEventTimesUpdated, scheduleOverlapLayoutRepaint],
  );

  const handleResize = useCallback(
    (info: EventResizeDoneArg) => {
      const patch = fcEventRangeToScheduledPatch(info.event);
      if (!patch) return;
      onEventTimesUpdated(info.event.id, patch, info.revert);
      scheduleOverlapLayoutRepaint(info.view.calendar.getEvents());
    },
    [onEventTimesUpdated, scheduleOverlapLayoutRepaint],
  );

  const handleEventDidMount = useCallback(
    (info: EventMountArg) => {
      const ep = info.event.extendedProps;
      const baseColor = String(ep.eventCalendarBaseColor ?? "");
      const bodyFill = String(ep.eventBodyFill ?? "");
      const useStripe = Boolean(ep.useCalendarStripe);
      scheduleTadEventStripePaint(info.el, {
        useStripe,
        baseColor,
        bodyFill,
      });
      scheduleTadEventRsvpPaint(info.el, ep.rsvpStatus);

      scheduleOverlapLayoutRepaint(info.view.calendar.getEvents());
    },
    [scheduleOverlapLayoutRepaint],
  );

  const repaintMountedEventStripes = useCallback((eventApis: EventApi[]) => {
    const t = calendarColorThemeRef.current ?? {};
    const sourceEvents = eventsRef.current;
    const vis = visibleKindsRef.current;
    for (const ev of eventApis) {
      const el = (ev as unknown as { el?: HTMLElement | null }).el;
      if (!el || el.classList.contains("fc-event-mirror")) continue;
      const found = sourceEvents.find((e) => e.id === ev.id);
      if (!found || !vis[found.type]) continue;
      scheduleTadEventStripePaint(el, {
        useStripe: eventUsesCalendarStripe(found, t),
        baseColor: calendarChromeHex(found, t),
        bodyFill: eventFillHex(found, t),
      });
      scheduleTadEventRsvpPaint(
        el,
        found.type === "common" || found.type === "timeBlock"
          ? found.rsvpStatus
          : undefined,
      );
    }
  }, []);

  const handleEventsSet = useCallback(
    (eventApis: EventApi[]) => {
      repaintMountedEventStripes(eventApis);
      scheduleOverlapLayoutRepaint(eventApis);
    },
    [repaintMountedEventStripes, scheduleOverlapLayoutRepaint],
  );

  /**
   * FullCalendar reuses the same `.fc-event` node when `events` updates; `eventDidMount` does not
   * run again. `eventsSet` (below) repaints after FC mutates the node; this covers the same tick as
   * React commit for any ordering edge cases.
   */
  useLayoutEffect(() => {
    const api = fcRef.current?.getApi();
    if (!api) return;
    const repaintLayout = () => {
      applyScheduledEventColorsToFullCalendar(
        api,
        eventsRef.current,
        visibleKindsRef.current,
        calendarColorThemeRef.current,
      );
      const list = api.getEvents();
      repaintMountedEventStripes(list);
      scheduleOverlapLayoutRepaint(list);
    };
    repaintLayout();
    let rafNested = 0;
    const raf1 = requestAnimationFrame(() => {
      repaintLayout();
      rafNested = requestAnimationFrame(repaintLayout);
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(rafNested);
    };
  }, [
    eventColorFingerprint,
    calendarColorTheme,
    visibleKinds,
    repaintMountedEventStripes,
    scheduleOverlapLayoutRepaint,
  ]);

  useEffect(() => {
    ensureTimegridOverlapLayoutObserver(fcContainerRef.current, () => ({
      sourceEvents: eventsRef.current,
      visibleKinds: visibleKindsRef.current,
      mountedEventApis: fcRef.current?.getApi().getEvents() ?? [],
    }));
  }, []);

  useLayoutEffect(() => {
    const api = fcRef.current?.getApi();
    if (!api || !draftSelectionHighlight) return;
    const { start, endExclusive, allDay } = draftSelectionHighlight;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      applyingProgrammaticSelectRef.current = true;
      try {
        api.select({ start, end: endExclusive, allDay });
      } finally {
        applyingProgrammaticSelectRef.current = false;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [draftSelectionHighlight, draftSelectionVersion]);

  useEffect(() => {
    if (!timeGrid.activeViewType.startsWith("timeGrid")) return;
    const raf = requestAnimationFrame(() => {
      timeGrid.syncTimeAxisCorner();
      requestAnimationFrame(() => {
        timeGrid.measureNowLineGeometry(timeGrid.activeViewType);
        timeGrid.notifyLayoutResize();
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [timeGridSlotMinutes, timeGrid]);

  return (
    <div
      className="take-and-do-calendar calendar-surface flex min-h-0 flex-1 flex-col overflow-hidden"
      data-time-grid-slot-min={timeGridSlotMinutes}
      data-draft-kind={draftSelectionKind ?? undefined}
      style={
        {
          "--tad-now-line-span": String(timeGrid.nowLineSpan),
          ...(timeGrid.nowLineWidthPx != null && timeGrid.nowLineWidthPx > 0
            ? { "--tad-now-line-width-px": `${timeGrid.nowLineWidthPx}px` }
            : {}),
          "--tad-axis-zone-count": String(zoneCount),
          ...(draftSelectionKind
            ? {
                "--draft-kind-color": effectiveInternalCalendarColor(
                  calendarColorTheme?.internalCalendarColor,
                ),
              }
            : {}),
        } as CSSProperties
      }
    >
      <CalendarPlanningToolbar
        getApi={getApi}
        activeViewType={timeGrid.activeViewType}
        toolbarMeta={toolbarMeta}
        slotTime24h={slotTime24h}
        onSlotTime24hChange={onSlotTime24hChange}
        timeGridSlotMinutes={timeGridSlotMinutes}
        onTimeGridSlotMinutesChange={setTimeGridSlotMinutes}
        onAlignViewToNow={timeGrid.scrollTimeGridToNowCentered}
        onToolbarNavigate={playToolbarNavigateAnimation}
      />
      <div
        ref={toolbarNavShellRef}
        className="tad-calendar-toolbar-nav-shell min-h-0 flex-1 overflow-hidden"
      >
        <div ref={fcContainerRef} className="h-full min-h-0 overflow-hidden">
          <FullCalendar
            key={fcColorSignature}
            ref={fcRef}
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              listPlugin,
              interactionPlugin,
            ]}
            views={PLANNING_CALENDAR_CUSTOM_VIEWS}
            headerToolbar={false}
            initialView={timeGrid.activeViewType}
            firstDay={1}
            editable
            eventResizableFromStart
            selectable
            selectMirror={false}
            selectLongPressDelay={0}
            selectMinDistance={5}
            slotDuration={slotDurationIso}
            snapDuration="00:15:00"
            slotLabelInterval="01:00:00"
            slotLabelFormat={slotLabelFormat}
            slotLabelContent={slotLabelContent}
            slotEventOverlap
            unselectCancel=".calendar-quick-menu,[data-dropdown-portal],[data-calendar-color-menu]"
            droppable
            nowIndicator
            nowIndicatorContent={timeGrid.nowIndicatorContent}
            nowIndicatorDidMount={timeGrid.handleNowIndicatorDidMount}
            nowIndicatorWillUnmount={timeGrid.handleNowIndicatorWillUnmount}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            scrollTimeReset={false}
            dayHeaderContent={PlanningCalendarDayHeaderContent}
            allDayText="All day"
            allDayContent={({ text }) => (
              <span className="tad-all-day-label">{text}</span>
            )}
            viewDidMount={timeGrid.handleViewDidMount}
            viewWillUnmount={timeGrid.handleViewWillUnmount}
            height="100%"
            events={fcEvents}
            eventsSet={handleEventsSet}
            datesSet={timeGrid.handleDatesSet}
            eventClick={handleEventClick}
            select={handleSelect}
            eventReceive={handleReceive}
            eventDrop={handleDrop}
            eventResize={handleResize}
            eventDidMount={handleEventDidMount}
            eventContent={(arg) => (
              <PlanningCalendarEventContent
                {...arg}
                slotTime24h={slotTime24h}
                draftSelectionKind={draftSelectionKind}
                gridSlotMinutes={timeGridSlotMinutes}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
});

PlanningCalendar.displayName = "PlanningCalendar";
