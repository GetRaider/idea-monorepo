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
  });

  const scheduledTasksQuery = useQuery({
    queryKey: queryKeys.tasks.byScheduleRange(fromIso, toIso),
    queryFn: () =>
      clientServices.tasks.getByScheduleRange(
        calendarQueryRange.from,
        calendarQueryRange.to,
      ),
    enabled: !isGuest,
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
      setCalendarQueryRange({ from: start, to: endExclusive });
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
