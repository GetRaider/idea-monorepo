"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import type {
  CalendarBacklogItem,
  CalendarPersistedState,
  CalendarScheduledEvent,
} from "@/types/calendar.types";

import { readCalendarState, writeCalendarState } from "./calendar-storage";

export function useCalendarStore() {
  const [state, setState] = useState<CalendarPersistedState | null>(null);

  useLayoutEffect(() => {
    setState(readCalendarState());
  }, []);

  useEffect(() => {
    if (!state) return;
    writeCalendarState(state);
  }, [state]);

  const addScheduled = useCallback((event: CalendarScheduledEvent) => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, events: [...prev.events, event] };
    });
  }, []);

  const updateScheduled = useCallback(
    (id: string, patch: Partial<CalendarScheduledEvent>) => {
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          events: prev.events.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        };
      });
    },
    [],
  );

  const removeScheduled = useCallback((id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, events: prev.events.filter((e) => e.id !== id) };
    });
  }, []);

  const addBacklogItem = useCallback((item: CalendarBacklogItem) => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, backlog: [...prev.backlog, item] };
    });
  }, []);

  const removeBacklogItem = useCallback((id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, backlog: prev.backlog.filter((b) => b.id !== id) };
    });
  }, []);

  return {
    state,
    addScheduled,
    updateScheduled,
    removeScheduled,
    addBacklogItem,
    removeBacklogItem,
  };
}
