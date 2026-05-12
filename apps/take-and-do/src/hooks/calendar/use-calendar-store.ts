"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { defaultAxisTimeZones } from "@/components/Calendar/calendar-axis-time";

import type {
  CalendarAxisTimeZone,
  CalendarBacklogEvent,
  CalendarPersistedState,
  CalendarEvent,
} from "@/types/calendar.types";

import { readCalendarState, writeCalendarState } from "./calendar-storage";
import { getEffectiveGoogleRecurrence } from "@/lib/push-google-calendar-event";
import { mergeGoogleCalendarImportedEvents } from "./merge-google-calendar-import";

const GCAL_PREFIX = "gcal:";

export function useCalendarStore() {
  const [state, setState] = useState<CalendarPersistedState | null>(null);

  useLayoutEffect(() => {
    setState(readCalendarState());
  }, []);

  useEffect(() => {
    if (!state) return;
    writeCalendarState(state);
  }, [state]);

  const addScheduled = useCallback((event: CalendarEvent) => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, events: [...prev.events, event] };
    });
  }, []);

  type CalendarEventPatch = Partial<{
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    reminderMinutes: number;
    timeZone: string;
    repeat: CalendarEvent["repeat"];
    meetingUrl: string;
    participants: string[];
    notes: string;
    description: string;
    taskSummarySnapshot: string;
    rsvpStatus: "yes" | "no" | "maybe";
    rsvpDeclineReason: string;
  }>;

  const patchScheduled = useCallback(
    (id: string, patch: CalendarEventPatch) => {
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          events: prev.events.map((e) => {
            if (e.id !== id) return e;
            const next = { ...e, ...patch };
            if (e.type !== "common") {
              // Strip common-only fields if they got patched in
              delete (next as { rsvpStatus?: unknown }).rsvpStatus;
              delete (next as { rsvpDeclineReason?: unknown })
                .rsvpDeclineReason;
            }
            return next;
          }),
        };
      });
    },
    [],
  );

  const replaceScheduled = useCallback((event: CalendarEvent) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        events: prev.events.map((e) => (e.id === event.id ? event : e)),
      };
    });
  }, []);

  const removeScheduled = useCallback((id: string) => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, events: prev.events.filter((e) => e.id !== id) };
    });
  }, []);

  const addBacklogItem = useCallback((item: CalendarBacklogEvent) => {
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

  const updateBacklogItem = useCallback(
    (id: string, patch: Partial<CalendarBacklogEvent>) => {
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          backlog: prev.backlog.map((b) =>
            b.id === id ? { ...b, ...patch } : b,
          ),
        };
      });
    },
    [],
  );

  const mergeScheduledEvents = useCallback((events: CalendarEvent[]) => {
    setState((prev) => {
      if (!prev) return prev;
      const byId = new Map(prev.events.map((e) => [e.id, e]));
      for (const ev of events) byId.set(ev.id, ev);
      return { ...prev, events: Array.from(byId.values()) };
    });
  }, []);

  const mergeGoogleCalendarSync = useCallback(
    (
      imported: CalendarEvent[],
      opts: {
        incremental: boolean;
        syncRange?: { timeMin: string; timeMax: string };
      },
    ) => {
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          events: mergeGoogleCalendarImportedEvents(
            prev.events,
            imported,
            opts,
          ),
        };
      });
    },
    [],
  );

  const removeGoogleImportedEvents = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      const filtered = prev.events.filter((e) => !e.id.startsWith(GCAL_PREFIX));
      if (filtered.length === prev.events.length) return prev;
      return { ...prev, events: filtered };
    });
  }, []);

  const removeGoogleSeriesByMasterId = useCallback(
    (recurringMasterId: string) => {
      setState((prev) => {
        if (!prev) return prev;
        const filtered = prev.events.filter((e) => {
          if (!e.id.startsWith(GCAL_PREFIX)) return true;
          if (e.type !== "common") return true;
          return (
            getEffectiveGoogleRecurrence(e)?.recurringEventId !==
            recurringMasterId
          );
        });
        if (filtered.length === prev.events.length) return prev;
        return { ...prev, events: filtered };
      });
    },
    [],
  );

  const setAxisTimeZones = useCallback((next: CalendarAxisTimeZone[]) => {
    setState((prev) => {
      if (!prev) return prev;
      const zones = next.length > 0 ? next : defaultAxisTimeZones();
      return { ...prev, axisTimeZones: zones };
    });
  }, []);

  return {
    state,
    addScheduled,
    patchScheduled,
    replaceScheduled,
    removeScheduled,
    addBacklogItem,
    removeBacklogItem,
    updateBacklogItem,
    mergeScheduledEvents,
    mergeGoogleCalendarSync,
    removeGoogleImportedEvents,
    removeGoogleSeriesByMasterId,
    setAxisTimeZones,
  };
}
