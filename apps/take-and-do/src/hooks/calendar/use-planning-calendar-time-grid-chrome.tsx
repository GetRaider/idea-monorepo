"use client";

import type {
  DatesSetArg,
  NowIndicatorContentArg,
  NowIndicatorMountArg,
  ViewMountArg,
} from "@fullcalendar/core";
import type FullCalendar from "@fullcalendar/react";
import { createRoot, type Root } from "react-dom/client";
import type { RefObject, Dispatch, SetStateAction } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { CalendarAxisTimeZone } from "@/types/calendar.types";

import { CalendarAxisCorner } from "@/components/Calendar";
import { alignNowLineToVerticalCenter } from "@/helpers/calendar/planning-calendar-dom";
import {
  formatNowHm,
  pad2,
} from "@/helpers/calendar/planning-calendar-time-format";
import { planningCalendarToolbarMetaFromDatesSet } from "@/helpers/calendar/planning-calendar-toolbar-meta";
import type { PlanningCalendarToolbarMeta } from "@/helpers/calendar/planning-calendar-toolbar-meta";

type UsePlanningCalendarTimeGridChromeParams = {
  fcRef: RefObject<FullCalendar | null>;
  fcContainerRef: RefObject<HTMLDivElement | null>;
  axisTimeZones: CalendarAxisTimeZone[];
  onAxisTimeZonesChange: (next: CalendarAxisTimeZone[]) => void;
  slotTime24h: boolean;
  setToolbarMeta: Dispatch<SetStateAction<PlanningCalendarToolbarMeta | null>>;
  /** Drives ResizeObserver re-measure when the headline range string changes. */
  toolbarRangeLabel: string | undefined;
  onVisibleRangeChange?: (start: Date, endExclusive: Date) => void;
};

export function usePlanningCalendarTimeGridChrome({
  fcRef,
  fcContainerRef,
  axisTimeZones,
  onAxisTimeZonesChange,
  slotTime24h,
  setToolbarMeta,
  toolbarRangeLabel,
  onVisibleRangeChange,
}: UsePlanningCalendarTimeGridChromeParams) {
  const nowIndicatorLineElRef = useRef<HTMLElement | null>(null);
  const axisCornerRootRef = useRef<Root | null>(null);
  const axisCornerHostRef = useRef<HTMLElement | null>(null);
  const shouldAutoScrollTimeGridToNowRef = useRef(true);

  const [activeViewType, setActiveViewType] = useState("timeGridRollingWeek");
  const [nowLineSpan, setNowLineSpan] = useState(7);
  const [nowLineWidthPx, setNowLineWidthPx] = useState<number | null>(null);

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

  const renderAxisCornerIntoFrame = useCallback(() => {
    const rootEl = fcContainerRef.current;
    if (!rootEl) return;
    const frame = rootEl.querySelector(
      ".fc-scrollgrid-section-header .fc-timegrid-axis .fc-timegrid-axis-frame",
    );
    if (!(frame instanceof HTMLElement)) return;

    if (axisCornerHostRef.current !== frame) {
      const previousRoot = axisCornerRootRef.current;
      axisCornerRootRef.current = null;
      axisCornerHostRef.current = frame;
      if (previousRoot) {
        queueMicrotask(() => {
          previousRoot.unmount();
        });
      }
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
  }, [axisTimeZones, fcContainerRef, onAxisTimeZonesChange]);

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
    [activeViewType, fcContainerRef, resolveMountedNowLineEl],
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
      const rootToUnmount = axisCornerRootRef.current;
      window.setTimeout(() => {
        if (axisCornerRootRef.current === rootToUnmount) {
          rootToUnmount?.unmount();
          axisCornerRootRef.current = null;
          axisCornerHostRef.current = null;
        }
      }, 0);
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
    const rootToUnmount = axisCornerRootRef.current;
    window.setTimeout(() => {
      if (axisCornerRootRef.current === rootToUnmount) {
        rootToUnmount?.unmount();
        axisCornerRootRef.current = null;
        axisCornerHostRef.current = null;
      }
    }, 0);
  }, []);

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
  }, [fcContainerRef, fcRef]);

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
  }, [activeViewType, fcRef, measureNowLineGeometry, syncTimeAxisCorner]);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      setActiveViewType(arg.view.type);
      const rangeStart = arg.start;
      const rangeEndExclusive = arg.end;
      setToolbarMeta(planningCalendarToolbarMetaFromDatesSet(arg));

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
      measureNowLineGeometry,
      onVisibleRangeChange,
      scrollTimeGridToNowCentered,
      setToolbarMeta,
      syncTimeAxisCorner,
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
  }, [
    activeViewType,
    fcContainerRef,
    measureNowLineGeometry,
    toolbarRangeLabel,
  ]);

  return useMemo(
    () => ({
      activeViewType,
      nowLineSpan,
      nowLineWidthPx,
      nowIndicatorContent,
      handleNowIndicatorDidMount,
      handleNowIndicatorWillUnmount,
      handleViewDidMount,
      handleViewWillUnmount,
      handleDatesSet,
      scrollTimeGridToNowCentered,
      notifyLayoutResize,
      syncTimeAxisCorner,
      measureNowLineGeometry,
    }),
    [
      activeViewType,
      nowLineSpan,
      nowLineWidthPx,
      nowIndicatorContent,
      handleNowIndicatorDidMount,
      handleNowIndicatorWillUnmount,
      handleViewDidMount,
      handleViewWillUnmount,
      handleDatesSet,
      scrollTimeGridToNowCentered,
      notifyLayoutResize,
      syncTimeAxisCorner,
      measureNowLineGeometry,
    ],
  );
}
