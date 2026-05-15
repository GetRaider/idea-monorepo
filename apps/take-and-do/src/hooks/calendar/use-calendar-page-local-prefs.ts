import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";

import {
  CALENDAR_SIDEBAR_COLLAPSED_STORAGE_KEY,
  CALENDAR_SLOT_TIME_24H_STORAGE_KEY,
} from "@/constants/calendar.constants";

import type { PlanningCalendarHandle } from "@/components/Calendar";

export function useCalendarPageLocalPrefs(
  planningCalendarRef: RefObject<PlanningCalendarHandle | null>,
) {
  const [slotTime24h, setSlotTime24h] = useState(false);
  const [calendarSidebarCollapsed, setCalendarSidebarCollapsed] =
    useState(false);

  useEffect(() => {
    try {
      setSlotTime24h(
        window.localStorage.getItem(CALENDAR_SLOT_TIME_24H_STORAGE_KEY) === "1",
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      setCalendarSidebarCollapsed(
        window.localStorage.getItem(CALENDAR_SIDEBAR_COLLAPSED_STORAGE_KEY) ===
          "1",
      );
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCalendarSidebar = useCallback(() => {
    setCalendarSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(
          CALENDAR_SIDEBAR_COLLAPSED_STORAGE_KEY,
          next ? "1" : "0",
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const bump = () => planningCalendarRef.current?.notifyLayoutResize();
    bump();
    const raf = requestAnimationFrame(() => {
      bump();
      requestAnimationFrame(bump);
    });
    const t = window.setTimeout(bump, 350);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [calendarSidebarCollapsed, planningCalendarRef]);

  const setSlotTime24hPersist = useCallback((next: boolean) => {
    setSlotTime24h(next);
    try {
      window.localStorage.setItem(
        CALENDAR_SLOT_TIME_24H_STORAGE_KEY,
        next ? "1" : "0",
      );
    } catch {
      /* ignore */
    }
  }, []);

  return {
    slotTime24h,
    setSlotTime24hPersist,
    calendarSidebarCollapsed,
    toggleCalendarSidebar,
  };
}
