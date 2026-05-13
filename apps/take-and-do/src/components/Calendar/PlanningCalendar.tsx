"use client";

import type {
  DateSelectArg,
  DatesSetArg,
  DayHeaderContentArg,
  EventApi,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  EventInput,
  EventMountArg,
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
  calendarStripeHex,
  eventFillHex,
  eventUsesCalendarStripe,
} from "./calendar-colors";
import {
  extendedPropsToKind,
  fcEventRangeToScheduledPatch,
  kindColor,
  kindLabel,
  scheduledToEventInput,
  type CalendarEventColorTheme,
} from "./calendar-event-mapper";
import { CalendarKindIcon, calendarKindIconSizePx } from "./CalendarKindIcon";
import "./calendar-theme.css";

const CUSTOM_VIEWS = {
  /** Seven days starting on the anchor date (use “today” so the current day is the left column). */
  timeGridRollingWeek: {
    type: "timeGrid" as const,
    duration: { days: 7 },
    dateIncrement: { days: 7 },
    dateAlignment: "day" as const,
    buttonText: "7d",
  },
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

function findTimegridBodyScroller(fcRoot: HTMLElement): HTMLElement | null {
  const body = fcRoot.querySelector(".fc-timegrid-body");
  if (!body) return null;
  const scrollers = body.querySelectorAll(".fc-scroller");
  let best: HTMLElement | null = null;
  let bestOverflow = 0;
  for (const el of scrollers) {
    if (!(el instanceof HTMLElement)) continue;
    const overflow = el.scrollHeight - el.clientHeight;
    if (overflow > bestOverflow) {
      bestOverflow = overflow;
      best = el;
    }
  }
  if (best) return best;
  const first = scrollers[0];
  return first instanceof HTMLElement ? first : null;
}

/** Prefer the now line in today’s time column inside the slot body (not header / all-day). */
function findTimegridNowLineEl(fcRoot: HTMLElement): HTMLElement | null {
  const body = fcRoot.querySelector(".fc-timegrid-body");
  if (!body) return null;
  const inToday = body.querySelector(
    ".fc-day-today .fc-timegrid-now-indicator-line",
  ) as HTMLElement | null;
  if (inToday) return inToday;
  return body.querySelector(
    ".fc-timegrid-now-indicator-line",
  ) as HTMLElement | null;
}

/**
 * Walks up from the now line to find the vertical scroll container that actually
 * moves the slots (FC nests multiple `.fc-scroller` nodes — picking by overflow alone
 * can target the wrong one, which leaves “now” pinned to the top after scrollToTime).
 */
function findSlotScrollParent(
  fcRoot: HTMLElement,
  from: HTMLElement,
): HTMLElement | null {
  let p: HTMLElement | null = from;
  let best: HTMLElement | null = null;
  let bestArea = 0;
  while (p && fcRoot.contains(p)) {
    const delta = p.scrollHeight - p.clientHeight;
    if (delta > 2) {
      const oy = getComputedStyle(p).overflowY;
      const fcScroller = p.classList.contains("fc-scroller");
      if (oy === "auto" || oy === "scroll" || fcScroller) {
        const area = p.clientWidth * p.clientHeight;
        if (area > bestArea) {
          bestArea = area;
          best = p;
        }
      }
    }
    p = p.parentElement;
  }
  return best;
}

/** Returns false if the now line is not in the DOM yet (retry on the next frame). */
function alignNowLineToVerticalCenter(fcRoot: HTMLElement): boolean {
  const nowLine = findTimegridNowLineEl(fcRoot);
  if (!nowLine) return false;
  const scroller =
    findSlotScrollParent(fcRoot, nowLine) ?? findTimegridBodyScroller(fcRoot);
  if (!scroller) return false;

  for (let pass = 0; pass < 4; pass++) {
    const sRect = scroller.getBoundingClientRect();
    const nRect = nowLine.getBoundingClientRect();
    const lineCenter = nRect.top + nRect.height / 2;
    const scrollerCenter = sRect.top + scroller.clientHeight / 2;
    const delta = lineCenter - scrollerCenter;
    if (Math.abs(delta) < 3) return true;
    scroller.scrollTop += delta;
  }
  return true;
}

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

const TAD_EVENT_STRIPE_PX = 5;

function applyTadEventStripeToEl(
  el: HTMLElement,
  opts: {
    useStripe: boolean;
    baseColor: string;
    bodyFill: string;
  },
) {
  const { useStripe, baseColor, bodyFill } = opts;
  const on = useStripe && baseColor && bodyFill;
  if (on) {
    el.classList.add("tad-event-calendar-stripe");
    el.style.setProperty("--tad-event-base-color", baseColor);
    el.style.setProperty("--tad-event-body-fill", bodyFill);
    el.style.setProperty("--tad-event-stripe-w", `${TAD_EVENT_STRIPE_PX}px`);
  } else {
    el.classList.remove("tad-event-calendar-stripe");
    el.style.removeProperty("--tad-event-base-color");
    el.style.removeProperty("--tad-event-body-fill");
    el.style.removeProperty("--tad-event-stripe-w");
  }
}

function scheduleTadEventStripePaint(
  el: HTMLElement,
  opts: { useStripe: boolean; baseColor: string; bodyFill: string },
) {
  const paint = () => applyTadEventStripeToEl(el, opts);
  paint();
  requestAnimationFrame(() => {
    paint();
    requestAnimationFrame(paint);
  });
  window.setTimeout(paint, 0);
  window.setTimeout(paint, 32);
  window.setTimeout(paint, 100);
  /** FC may re-apply inline `backgroundColor` after `eventsSet` / layout; late pass restores CSS vars. */
  window.setTimeout(paint, 220);
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
  /** FC’s mounted `.fc-timegrid-now-indicator-line` (avoids wrong match when multiple bodies exist, e.g. week). */
  const nowIndicatorLineElRef = useRef<HTMLElement | null>(null);
  const axisCornerRootRef = useRef<Root | null>(null);
  const axisCornerHostRef = useRef<HTMLElement | null>(null);
  /** Prevents `api.select()` from re-entering `select` → `onSelectRange` → setState loop. */
  const applyingProgrammaticSelectRef = useRef(false);
  /**
   * When true, the next time-grid `datesSet` should scroll the slot area to wall-clock “now”.
   * Set false after doing so; set true again when leaving time-grid (e.g. month) so returning
   * re-centers. Prev/next within the same view does not reset this, so vertical scroll is kept.
   */
  const shouldAutoScrollTimeGridToNowRef = useRef(true);
  const [activeViewType, setActiveViewType] = useState("timeGridRollingWeek");
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

  const resolveMountedNowLineEl = useCallback(
    (mounted: HTMLElement | null): HTMLElement | null => {
      if (!mounted?.isConnected) return null;
      if (mounted.classList.contains("fc-timegrid-now-indicator-line")) {
        return mounted;
      }
      const inner = mounted.querySelector(".fc-timegrid-now-indicator-line");
      return inner instanceof HTMLElement ? inner : null;
    },
    [],
  );

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

      const mountedRaw = nowIndicatorLineElRef.current;
      const mounted = resolveMountedNowLineEl(mountedRaw);
      let todayTd: HTMLElement | null = null;
      let lineEl: HTMLElement | null = null;

      if (mounted) {
        const td = mounted.closest("td.fc-timegrid-col");
        if (
          td instanceof HTMLElement &&
          td.classList.contains("fc-day-today")
        ) {
          todayTd = td;
          lineEl = mounted;
        }
      }

      if (!(todayTd instanceof HTMLElement) || !lineEl) {
        const todayCandidates = root.querySelectorAll(
          "td.fc-day-today.fc-timegrid-col",
        );
        todayTd = null;
        lineEl = null;
        for (const td of todayCandidates) {
          if (td.querySelector(".fc-timegrid-now-indicator-line")) {
            todayTd = td as HTMLElement;
            break;
          }
        }
        if (!todayTd && todayCandidates.length > 0) {
          todayTd = todayCandidates[0] as HTMLElement;
        }
        if (!(todayTd instanceof HTMLElement)) {
          setNowLineSpan(1);
          setNowLineWidthPx(null);
          return;
        }
        const lineInToday = todayTd.querySelector(
          ".fc-timegrid-now-indicator-line",
        );
        lineEl =
          (lineInToday instanceof HTMLElement ? lineInToday : null) ??
          (root.querySelector(
            ".fc-timegrid-now-indicator-line",
          ) as HTMLElement | null);
      }

      const colsRoot =
        (todayTd.closest(".fc-timegrid-cols") as HTMLElement | null) ??
        (root.querySelector(".fc-timegrid-cols") as HTMLElement | null);
      if (!colsRoot) {
        setNowLineSpan(1);
        setNowLineWidthPx(null);
        return;
      }

      if (!lineEl) {
        const lineInToday = todayTd.querySelector(
          ".fc-timegrid-now-indicator-line",
        );
        lineEl =
          (lineInToday instanceof HTMLElement ? lineInToday : null) ??
          (colsRoot.querySelector(
            ".fc-timegrid-now-indicator-line",
          ) as HTMLElement | null);
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
      let idx = dayCells.indexOf(todayTd);
      if (idx < 0) {
        idx = dayCells.findIndex((td) => td.classList.contains("fc-day-today"));
      }
      const n = dayCells.length;
      const spanFromToday = idx >= 0 && n > 0 ? n - idx : 1;
      setNowLineSpan(n > 0 ? n : spanFromToday);

      let offsetBeforeTodayPx = 0;
      let totalWidthPx = 0;
      if (idx >= 0 && n > 0) {
        for (let i = 0; i < idx; i++) {
          offsetBeforeTodayPx += dayCells[i].getBoundingClientRect().width;
        }
        for (let i = 0; i < n; i++) {
          totalWidthPx += dayCells[i].getBoundingClientRect().width;
        }
      } else {
        const frame = todayTd.querySelector(".fc-timegrid-col-frame");
        const w =
          frame?.getBoundingClientRect().width ??
          todayTd.getBoundingClientRect().width;
        totalWidthPx = w * spanFromToday;
      }

      const widthPx = Math.round(totalWidthPx * 1000) / 1000;
      // Avoid persisting 0: --tad-now-line-width-px would override the CSS fallback
      // (calc(100% * span)) with 0px and hide the line until a full remount.
      setNowLineWidthPx(widthPx > 0 ? widthPx : null);

      const applyNowLinePlacement = (el: HTMLElement) => {
        if (widthPx > 0) {
          el.style.setProperty("width", `${widthPx}px`, "important");
          if (offsetBeforeTodayPx > 0) {
            el.style.setProperty(
              "inset-inline-start",
              `${-offsetBeforeTodayPx}px`,
              "important",
            );
          } else {
            el.style.removeProperty("inset-inline-start");
          }
        } else {
          el.style.removeProperty("width");
          el.style.removeProperty("inset-inline-start");
        }
      };

      const lineNodes = new Set<HTMLElement>();
      root.querySelectorAll("td.fc-day-today.fc-timegrid-col").forEach((td) => {
        td.querySelectorAll(".fc-timegrid-now-indicator-line").forEach((n) => {
          if (n instanceof HTMLElement) lineNodes.add(n);
        });
      });
      if (lineNodes.size === 0 && lineEl instanceof HTMLElement) {
        lineNodes.add(lineEl);
      }
      lineNodes.forEach(applyNowLinePlacement);
    },
    [activeViewType, resolveMountedNowLineEl],
  );

  const handleNowIndicatorDidMount = useCallback(
    (arg: NowIndicatorMountArg) => {
      if (arg.isAxis) return;
      const resolved = arg.el.classList.contains(
        "fc-timegrid-now-indicator-line",
      )
        ? arg.el
        : ((arg.el.querySelector(
            ".fc-timegrid-now-indicator-line",
          ) as HTMLElement | null) ?? arg.el);
      nowIndicatorLineElRef.current = resolved;
      requestAnimationFrame(() => {
        measureNowLineGeometry();
        requestAnimationFrame(() => {
          measureNowLineGeometry();
        });
      });
    },
    [measureNowLineGeometry],
  );

  const handleNowIndicatorWillUnmount = useCallback(
    (arg: NowIndicatorMountArg) => {
      if (arg.isAxis) return;
      const r = nowIndicatorLineElRef.current;
      if (r && (r === arg.el || arg.el.contains(r))) {
        nowIndicatorLineElRef.current = null;
      }
    },
    [],
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

  const scrollTimeGridToNowCentered = useCallback(() => {
    const api = fcRef.current?.getApi();
    const root = fcContainerRef.current;
    if (!api || !root) return;
    if (!api.view.type.startsWith("timeGrid")) return;

    const now = new Date();
    api.scrollToTime({
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
    });

    let attempts = 0;
    const maxAttempts = 24;
    const tick = () => {
      attempts += 1;
      const ok = alignNowLineToVerticalCenter(root);
      if (ok || attempts >= maxAttempts) return;
      requestAnimationFrame(tick);
    };
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        tick();
        requestAnimationFrame(() => {
          alignNowLineToVerticalCenter(root);
        });
      });
    });
  }, []);

  const notifyLayoutResize = useCallback(() => {
    const api = fcRef.current?.getApi();
    if (!api) return;
    api.updateSize();
    requestAnimationFrame(() => {
      syncTimeAxisCorner();
      if (activeViewType.startsWith("timeGrid")) {
        measureNowLineGeometry(activeViewType);
      }
    });
  }, [activeViewType, measureNowLineGeometry, syncTimeAxisCorner]);

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
        scrollTimeGridToNowCentered();
      },
      notifyLayoutResize,
    }),
    [notifyLayoutResize, scrollTimeGridToNowCentered],
  );

  const fcEvents: EventInput[] = useMemo(() => {
    const filtered = events.filter((e) => visibleKinds[e.type]);
    return filtered.map((e) => scheduledToEventInput(e, calendarColorTheme));
  }, [events, visibleKinds, calendarColorTheme]);

  /**
   * FullCalendar often skips updating inline `backgroundColor` when only styling inputs change for
   * an existing event id. Remount when computed fills or calendar chrome change so coerced colors
   * and kind/google defaults appear without a full page reload.
   */
  const fcColorSignature = useMemo(() => {
    const body = fcEvents
      .map((ev) => `${String(ev.id)}:${String(ev.backgroundColor ?? "")}`)
      .join("|");
    const kindJson =
      calendarColorTheme?.kindColors != null
        ? JSON.stringify(calendarColorTheme.kindColors)
        : "";
    const google = calendarColorTheme?.googleCalendarColor ?? "";
    return `${body}|${kindJson}|${google}`;
  }, [fcEvents, calendarColorTheme]);

  const prevFcColorSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevFcColorSignatureRef.current;
    prevFcColorSignatureRef.current = fcColorSignature;
    if (prev === null || prev === fcColorSignature) return;
    if (!activeViewType.startsWith("timeGrid")) return;
    requestAnimationFrame(() => {
      syncTimeAxisCorner();
      requestAnimationFrame(() => {
        measureNowLineGeometry(activeViewType);
        scrollTimeGridToNowCentered();
      });
    });
  }, [
    fcColorSignature,
    activeViewType,
    syncTimeAxisCorner,
    measureNowLineGeometry,
    scrollTimeGridToNowCentered,
  ]);

  const findBacklogItem = useCallback(
    (id: string | null) =>
      id ? (backlog.find((b) => b.id === id) ?? null) : null,
    [backlog],
  );

  useEffect(() => {
    const el = backlogContainerRef.current;
    if (!el) return;

    const draggable = new Draggable(el, {
      itemSelector:
        ".calendar-backlog-draggable, .calendar-panel-task-draggable",
      eventData: (dragEl) => {
        const taskBoardId = dragEl.getAttribute("data-calendar-task-board-id");
        const taskId = dragEl.getAttribute("data-calendar-task-id");
        if (taskBoardId && taskId) {
          const title =
            dragEl.getAttribute("data-calendar-task-title")?.trim() || "Task";
          const rawMin = dragEl.getAttribute(
            "data-calendar-task-duration-minutes",
          );
          const parsed = rawMin ? Number(rawMin) : NaN;
          const minutes =
            Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 60;
          const snapshot =
            dragEl
              .getAttribute("data-calendar-task-summary-snapshot")
              ?.trim() || title;
          return {
            title,
            duration: { minutes },
            extendedProps: {
              kind: "task",
              taskBoardId,
              taskId,
              taskSummarySnapshot: snapshot,
            },
          };
        }
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
        const runAutoScrollToNow = shouldAutoScrollTimeGridToNowRef.current;
        if (runAutoScrollToNow) {
          shouldAutoScrollTimeGridToNowRef.current = false;
        }
        requestAnimationFrame(() => {
          syncTimeAxisCorner();
          requestAnimationFrame(() => {
            measureNowLineGeometry(arg.view.type);
            if (runAutoScrollToNow) {
              scrollTimeGridToNowCentered();
            }
          });
        });
      } else {
        shouldAutoScrollTimeGridToNowRef.current = true;
        setNowLineSpan(1);
        setNowLineWidthPx(null);
      }
      onVisibleRangeChange?.(rangeStart, rangeEndExclusive);
    },
    [
      syncTimeAxisCorner,
      measureNowLineGeometry,
      scrollTimeGridToNowCentered,
      onVisibleRangeChange,
    ],
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

  const handleDrop = useCallback(
    (info: EventDropArg) => {
      const patch = fcEventRangeToScheduledPatch(info.event);
      if (!patch) return;
      onEventTimesUpdated(info.event.id, patch, info.revert);
    },
    [onEventTimesUpdated],
  );

  const handleResize = useCallback(
    (info: EventResizeDoneArg) => {
      const patch = fcEventRangeToScheduledPatch(info.event);
      if (!patch) return;
      onEventTimesUpdated(info.event.id, patch, info.revert);
    },
    [onEventTimesUpdated],
  );

  const handleEventDidMount = useCallback((info: EventMountArg) => {
    const ep = info.event.extendedProps;
    const baseColor = String(ep.eventCalendarBaseColor ?? "");
    const bodyFill = String(ep.eventBodyFill ?? "");
    const useStripe = Boolean(ep.useCalendarStripe);
    scheduleTadEventStripePaint(info.el, {
      useStripe,
      baseColor,
      bodyFill,
    });
  }, []);

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
        baseColor: calendarStripeHex(found, t),
        bodyFill: eventFillHex(found, t),
      });
    }
  }, []);

  const handleEventsSet = useCallback(
    (eventApis: EventApi[]) => {
      repaintMountedEventStripes(eventApis);
    },
    [repaintMountedEventStripes],
  );

  /**
   * FullCalendar reuses the same `.fc-event` node when `events` updates; `eventDidMount` does not
   * run again. `eventsSet` (below) repaints after FC mutates the node; this covers the same tick as
   * React commit for any ordering edge cases.
   */
  useLayoutEffect(() => {
    const api = fcRef.current?.getApi();
    if (!api) return;
    repaintMountedEventStripes(api.getEvents());
    let rafNested = 0;
    const raf1 = requestAnimationFrame(() => {
      repaintMountedEventStripes(api.getEvents());
      rafNested = requestAnimationFrame(() =>
        repaintMountedEventStripes(api.getEvents()),
      );
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(rafNested);
    };
  }, [events, calendarColorTheme, visibleKinds, repaintMountedEventStripes]);

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
          ...(nowLineWidthPx != null && nowLineWidthPx > 0
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
        onAlignViewToNow={scrollTimeGridToNowCentered}
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
            views={CUSTOM_VIEWS}
            headerToolbar={false}
            initialView="timeGridRollingWeek"
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
            unselectCancel=".calendar-quick-menu,[data-dropdown-portal],[data-calendar-color-menu]"
            droppable
            nowIndicator
            nowIndicatorContent={nowIndicatorContent}
            nowIndicatorDidMount={handleNowIndicatorDidMount}
            nowIndicatorWillUnmount={handleNowIndicatorWillUnmount}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            scrollTimeReset={false}
            dayHeaderContent={dayHeaderDayWeek}
            allDayText="All day"
            allDayContent={({ text }) => (
              <span className="tad-all-day-label">{text}</span>
            )}
            viewDidMount={handleViewDidMount}
            viewWillUnmount={handleViewWillUnmount}
            height="100%"
            events={fcEvents}
            eventsSet={handleEventsSet}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            select={handleSelect}
            eventReceive={handleReceive}
            eventDrop={handleDrop}
            eventResize={handleResize}
            eventDidMount={handleEventDidMount}
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

              const timeBesideTitle =
                Boolean(timeSubtitle) && shortOneLineTimed;

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
    </div>
  );
});

PlanningCalendar.displayName = "PlanningCalendar";
