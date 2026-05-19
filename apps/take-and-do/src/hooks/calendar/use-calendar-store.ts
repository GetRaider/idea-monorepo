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
  CalendarPersistedState,
  GoogleCalendarRecurrenceScope,
} from "@/types/calendar.types";

import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";

import { readCalendarState, writeCalendarState } from "./calendar-storage";
import { CALENDAR_STATE_EXTERNAL_UPDATE_EVENT } from "./task-calendar-local-sync";
import {
  getEffectiveGoogleRecurrence,
  googleEventMatchesRecurrenceScope,
  googleRecurrenceSeriesLocalPatchKeys,
} from "@/helpers/calendar/google-calendar-recurrence.helper";
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

  const applyEventPatch = useCallback(
    (event: CalendarEvent, patch: CalendarEventPatch): CalendarEvent => {
      const next = { ...event, ...patch } as CalendarEvent;
      if (event.type !== "common" && event.type !== "timeBlock") {
        delete (next as { rsvpStatus?: unknown }).rsvpStatus;
        delete (next as { rsvpDeclineReason?: unknown }).rsvpDeclineReason;
      } else if (patch.rsvpStatus !== undefined && patch.rsvpStatus !== "no") {
        delete (next as { rsvpDeclineReason?: unknown }).rsvpDeclineReason;
      }
      if ("color" in patch) {
        if (patch.color === null || patch.color === "") {
          delete (next as { color?: string }).color;
        } else {
          const hex = normalizeHexColor(patch.color);
          if (hex) {
            (next as { color: string }).color = coerceHexToWhiteTextSafe(hex);
          } else {
            delete (next as { color?: string }).color;
          }
        }
      }
      return next;
    },
    [],
  );

  const seriesSafePatch = useCallback(
    (patch: CalendarEventPatch): CalendarEventPatch => {
      const allowed = googleRecurrenceSeriesLocalPatchKeys();
      const out: CalendarEventPatch = {};
      for (const [key, value] of Object.entries(patch)) {
        if (allowed.has(key)) {
          (out as Record<string, unknown>)[key] = value;
        }
      }
      return out;
    },
    [],
  );

  const patchScheduled = useCallback(
    (id: string, patch: CalendarEventPatch) => {
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          events: prev.events.map((e) =>
            e.id !== id ? e : applyEventPatch(e, patch),
          ),
        };
      });
    },
    [applyEventPatch],
  );

  const patchScheduledForGoogleScope = useCallback(
    (
      anchorId: string,
      patch: CalendarEventPatch,
      scope: GoogleCalendarRecurrenceScope,
    ) => {
      setState((prev) => {
        if (!prev) return prev;
        const anchor = prev.events.find((e) => e.id === anchorId);
        if (!anchor) return prev;
        const safe = seriesSafePatch(patch);
        return {
          ...prev,
          events: prev.events.map((e) => {
            if (!googleEventMatchesRecurrenceScope(e, anchor, scope)) return e;
            const usePatch =
              scope === "instance" || e.id === anchorId ? patch : safe;
            if (Object.keys(usePatch).length === 0) return e;
            return applyEventPatch(e, usePatch);
          }),
        };
      });
    },
    [applyEventPatch, seriesSafePatch],
  );

  const replaceScheduledForGoogleScope = useCallback(
    (event: CalendarEvent, scope: GoogleCalendarRecurrenceScope) => {
      const c = normalizeHexColor(event.color);
      const normalized =
        c != null
          ? ({ ...event, color: coerceHexToWhiteTextSafe(c) } as CalendarEvent)
          : event;
      setState((prev) => {
        if (!prev) return prev;
        const anchor = prev.events.find((e) => e.id === normalized.id);
        if (!anchor) return prev;
        const seriesPatch = seriesSafePatch(normalized as CalendarEventPatch);
        return {
          ...prev,
          events: prev.events.map((e) => {
            if (!googleEventMatchesRecurrenceScope(e, anchor, scope)) {
              return e;
            }
            if (e.id === normalized.id) return normalized;
            if (Object.keys(seriesPatch).length === 0) return e;
            return applyEventPatch(e, seriesPatch);
          }),
        };
      });
    },
    [applyEventPatch, seriesSafePatch],
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

  const setInternalCalendarColor = useCallback((color: string | null) => {
    setState((prev) => {
      if (!prev) return prev;
      const hex = color ? normalizeHexColor(color) : undefined;
      if (!hex) {
        const { internalCalendarColor: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        internalCalendarColor: coerceHexToWhiteTextSafe(hex),
      };
    });
  }, []);

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
    patchScheduledForGoogleScope,
    replaceScheduled,
    replaceScheduledForGoogleScope,
    removeScheduled,
    addBacklogItem,
    removeBacklogItem,
    updateBacklogItem,
    mergeScheduledEvents,
    mergeGoogleCalendarSync,
    removeGoogleImportedEvents,
    removeGoogleSeriesByMasterId,
    setAxisTimeZones,
    setInternalCalendarColor,
    setGoogleCalendarColor,
    syncExternalGridEvents,
  };
}
