import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";

import {
  CALENDAR_SIDEBAR_COLLAPSED_STORAGE_KEY,
  CALENDAR_SLOT_TIME_24H_STORAGE_KEY,
} from "@/constants/calendar.constants";
import { localStorageHelper } from "@/helpers/local-storage.helper";

import type { PlanningCalendarHandle } from "@/components/Calendar";

export function useCalendarPageLocalPrefs(
  planningCalendarRef: RefObject<PlanningCalendarHandle | null>,
) {
  const [slotTime24h, setSlotTime24h] = useState(false);
  const [calendarSidebarCollapsed, setCalendarSidebarCollapsed] =
    useState(false);

  useEffect(() => {
    setSlotTime24h(
      localStorageHelper.readString(CALENDAR_SLOT_TIME_24H_STORAGE_KEY) === "1",
    );
  }, []);

  useEffect(() => {
    setCalendarSidebarCollapsed(
      localStorageHelper.readString(CALENDAR_SIDEBAR_COLLAPSED_STORAGE_KEY) ===
        "1",
    );
  }, []);

  const toggleCalendarSidebar = useCallback(() => {
    setCalendarSidebarCollapsed((prev) => {
      const next = !prev;
      localStorageHelper.writeString(
        CALENDAR_SIDEBAR_COLLAPSED_STORAGE_KEY,
        next ? "1" : "0",
      );
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
    localStorageHelper.writeString(
      CALENDAR_SLOT_TIME_24H_STORAGE_KEY,
      next ? "1" : "0",
    );
  }, []);

  return {
    slotTime24h,
    setSlotTime24hPersist,
    calendarSidebarCollapsed,
    toggleCalendarSidebar,
  };
}
