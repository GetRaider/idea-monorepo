"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { GOOGLE_CALENDAR_EVENT_ID_PREFIX } from "@/constants/calendar.constants";
import { defaultAxisTimeZones } from "@/helpers/calendar/calendar-axis-time";
import {
  coerceHexToWhiteTextSafe,
  normalizeHexColor,
} from "@/helpers/calendar/calendar-colors";

import type {
  CalendarAxisTimeZone,
  CalendarBacklogEvent,
  CalendarEvent,
  CalendarEventType,
  CalendarPersistedState,
} from "@/types/calendar.types";

import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";

import { readCalendarState, writeCalendarState } from "./calendar-storage";
import { CALENDAR_STATE_EXTERNAL_UPDATE_EVENT } from "./task-calendar-local-sync";
import { getEffectiveGoogleRecurrence } from "@/helpers/calendar/google-calendar-recurrence.helper";
import { mergeGoogleCalendarImportedEvents } from "./merge-google-calendar-import";

export function useCalendarStore() {
  const isGuest = useIsAnonymous();
  const [state, setState] = useState<CalendarPersistedState | null>(null);

  useLayoutEffect(() => {
    const raw = readCalendarState();
    if (isGuest) {
      setState(raw);
    } else {
      setState({
        ...raw,
        events: raw.events.filter((e) =>
          e.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX),
        ),
      });
    }
  }, [isGuest]);

  useEffect(() => {
    const onExternal = () => {
      setState((prev) => {
        const raw = readCalendarState();
        if (isGuest) return raw;
        if (!prev) {
          return {
            ...raw,
            events: raw.events.filter((e) =>
              e.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX),
            ),
          };
        }
        const gcal = raw.events.filter((e) =>
          e.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX),
        );
        const user = prev.events.filter(
          (e) => !e.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX),
        );
        return { ...prev, ...raw, events: [...gcal, ...user] };
      });
    };
    window.addEventListener(CALENDAR_STATE_EXTERNAL_UPDATE_EVENT, onExternal);
    return () =>
      window.removeEventListener(
        CALENDAR_STATE_EXTERNAL_UPDATE_EVENT,
        onExternal,
      );
  }, [isGuest]);

  const syncExternalGridEvents = useCallback((blocks: CalendarEvent[]) => {
    setState((prev) => {
      if (!prev) return prev;
      const gcal = prev.events.filter((e) =>
        e.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX),
      );
      return { ...prev, events: [...gcal, ...blocks] };
    });
  }, []);

  useEffect(() => {
    if (!state) return;
    if (isGuest) {
      writeCalendarState(state);
    } else {
      writeCalendarState({
        ...state,
        events: state.events.filter((e) =>
          e.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX),
        ),
      });
    }
  }, [state, isGuest]);

  const addScheduled = useCallback((event: CalendarEvent) => {
    const c = normalizeHexColor(event.color);
    const ev =
      c != null
        ? ({ ...event, color: coerceHexToWhiteTextSafe(c) } as CalendarEvent)
        : event;
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, events: [...prev.events, ev] };
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
    color: string | null;
  }>;

  const patchScheduled = useCallback(
    (id: string, patch: CalendarEventPatch) => {
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          events: prev.events.map((e) => {
            if (e.id !== id) return e;
            const next = { ...e, ...patch } as CalendarEvent;
            if (e.type !== "common") {
              // Strip common-only fields if they got patched in
              delete (next as { rsvpStatus?: unknown }).rsvpStatus;
              delete (next as { rsvpDeclineReason?: unknown })
                .rsvpDeclineReason;
            }
            if ("color" in patch) {
              if (patch.color === null || patch.color === "") {
                delete (next as { color?: string }).color;
              } else {
                const hex = normalizeHexColor(patch.color);
                if (hex) {
                  (next as { color: string }).color =
                    coerceHexToWhiteTextSafe(hex);
                } else {
                  delete (next as { color?: string }).color;
                }
              }
            }
            return next;
          }),
        };
      });
    },
    [],
  );

  const replaceScheduled = useCallback((event: CalendarEvent) => {
    const c = normalizeHexColor(event.color);
    const ev =
      c != null
        ? ({ ...event, color: coerceHexToWhiteTextSafe(c) } as CalendarEvent)
        : event;
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        events: prev.events.map((e) => (e.id === ev.id ? ev : e)),
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
      const filtered = prev.events.filter(
        (e) => !e.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX),
      );
      if (filtered.length === prev.events.length) return prev;
      return { ...prev, events: filtered };
    });
  }, []);

  const removeGoogleSeriesByMasterId = useCallback(
    (recurringMasterId: string) => {
      setState((prev) => {
        if (!prev) return prev;
        const filtered = prev.events.filter((e) => {
          if (!e.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX)) return true;
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

  const setKindColor = useCallback(
    (kind: CalendarEventType, color: string | null) => {
      setState((prev) => {
        if (!prev) return prev;
        const hex = color ? normalizeHexColor(color) : undefined;
        const prevMap = prev.kindColors ?? {};
        const nextMap = { ...prevMap };
        if (!hex) {
          delete nextMap[kind];
        } else {
          nextMap[kind] = coerceHexToWhiteTextSafe(hex);
        }
        const keys = Object.keys(nextMap);
        return {
          ...prev,
          kindColors: keys.length > 0 ? nextMap : undefined,
        };
      });
    },
    [],
  );

  const setGoogleCalendarColor = useCallback((color: string | null) => {
    setState((prev) => {
      if (!prev) return prev;
      const hex = color ? normalizeHexColor(color) : undefined;
      if (!hex) {
        const { googleCalendarColor: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, googleCalendarColor: coerceHexToWhiteTextSafe(hex) };
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
    setKindColor,
    setGoogleCalendarColor,
    syncExternalGridEvents,
  };
}
