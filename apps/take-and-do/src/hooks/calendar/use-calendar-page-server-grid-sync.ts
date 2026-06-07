"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { buildVirtualTaskCalendarEvents } from "@/helpers/task-calendar-events.helper";
import { queryKeys } from "@/lib/query-keys";
import { clientServices } from "@/services";
import type { CalendarEvent } from "@/types/calendar.types";

export function useCalendarPageServerGridSync(
  isGuest: boolean,
  syncExternalGridEvents: (events: CalendarEvent[]) => void,
) {
  const queryClient = useQueryClient();

  const [calendarQueryRange, setCalendarQueryRange] = useState(() => {
    const from = new Date();
    from.setDate(from.getDate() - 21);
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setDate(to.getDate() + 120);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  });

  const fromIso = calendarQueryRange.from.toISOString();
  const toIso = calendarQueryRange.to.toISOString();

  const calendarEventsQuery = useQuery({
    queryKey: queryKeys.calendar.events(fromIso, toIso),
    queryFn: () =>
      clientServices.calendarEvents.list(
        calendarQueryRange.from,
        calendarQueryRange.to,
      ),
    enabled: !isGuest,
    staleTime: 60_000,
  });

  const scheduledTasksQuery = useQuery({
    queryKey: queryKeys.tasks.byScheduleRange(fromIso, toIso),
    queryFn: () =>
      clientServices.tasks.getByScheduleRange(
        calendarQueryRange.from,
        calendarQueryRange.to,
      ),
    enabled: !isGuest,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isGuest) return;
    const db = calendarEventsQuery.data ?? [];
    const tasks = scheduledTasksQuery.data ?? [];
    const virtual = buildVirtualTaskCalendarEvents(tasks);
    syncExternalGridEvents([...db, ...virtual]);
  }, [
    isGuest,
    syncExternalGridEvents,
    calendarEventsQuery.data,
    scheduledTasksQuery.data,
  ]);

  const bumpServerCalendar = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["calendar"] });
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }, [queryClient]);

  const handleVisibleRangeChange = useCallback(
    (start: Date, endExclusive: Date) => {
      const startMs = start.getTime();
      const endMs = endExclusive.getTime();
      if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
        return;
      }
      setCalendarQueryRange((previous) => {
        if (
          previous.from.getTime() === startMs &&
          previous.to.getTime() === endMs
        ) {
          return previous;
        }
        return { from: new Date(startMs), to: new Date(endMs) };
      });
    },
    [],
  );

  return {
    calendarEventsQuery,
    scheduledTasksQuery,
    bumpServerCalendar,
    handleVisibleRangeChange,
  };
}
