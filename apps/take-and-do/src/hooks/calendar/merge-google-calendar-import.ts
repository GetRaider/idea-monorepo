import type { CalendarEvent } from "@/types/calendar.types";

import {
  coerceHexToWhiteTextSafe,
  normalizeHexColor,
} from "@/components/Calendar/calendar-colors";

const GCAL_PREFIX = "gcal:";

function withCoercedEventColor(ev: CalendarEvent): CalendarEvent {
  const c = normalizeHexColor((ev as { color?: string }).color);
  if (!c) return ev;
  return { ...ev, color: coerceHexToWhiteTextSafe(c) } as CalendarEvent;
}

export type GoogleCalendarSyncRange = {
  timeMin: string;
  timeMax: string;
};

/** Parse YYYY-MM-DD prefix for all-day original starts. */
function parseYmdPrefix(value: string): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  return m ? m[1] : null;
}

/**
 * One recurring occurrence in Google (`singleEvents`), stable across API event id
 * changes (series split, etc.).
 */
export function recurringOccurrenceDedupeKey(ev: CalendarEvent): string | null {
  if (!ev.id.startsWith(GCAL_PREFIX) || ev.type !== "common") return null;
  const gr = ev.googleRecurrence;
  if (!gr?.recurringEventId) return null;
  const anchorStart = gr.originalStart ?? ev.start;
  const anchorAllDay = gr.originalAllDay ?? ev.allDay;
  if (!anchorStart) return null;
  if (anchorAllDay) {
    const ymd =
      parseYmdPrefix(anchorStart) ??
      (() => {
        const d = new Date(anchorStart);
        return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
      })();
    if (!ymd) return null;
    return `d:${ymd}`;
  }
  const ms = new Date(anchorStart).getTime();
  if (Number.isNaN(ms)) return null;
  return `t:${new Date(ms).toISOString()}`;
}

function eventIntersectsSyncRange(
  ev: CalendarEvent,
  range: GoogleCalendarSyncRange,
): boolean {
  const startMs = new Date(ev.start).getTime();
  const endMs = new Date(ev.end).getTime();
  const minMs = new Date(range.timeMin).getTime();
  const maxMs = new Date(range.timeMax).getTime();
  if (
    Number.isNaN(startMs) ||
    Number.isNaN(endMs) ||
    Number.isNaN(minMs) ||
    Number.isNaN(maxMs)
  ) {
    return false;
  }
  return startMs < maxMs && endMs > minMs;
}

export type MergeGoogleCalendarImportedOpts = {
  incremental: boolean;
  syncRange?: GoogleCalendarSyncRange;
};

/**
 * Merge a Google Calendar import into local events. Drops stale `gcal:` rows when
 * Google assigns new ids (recurring split, etc.) while keeping non-Google events.
 */
export function mergeGoogleCalendarImportedEvents(
  prevEvents: CalendarEvent[],
  imported: CalendarEvent[],
  opts: MergeGoogleCalendarImportedOpts,
): CalendarEvent[] {
  const importedIds = new Set(imported.map((e) => e.id));

  const winnerByOccurrence = new Map<string, string>();
  for (const ev of imported) {
    const k = recurringOccurrenceDedupeKey(ev);
    if (k) winnerByOccurrence.set(k, ev.id);
  }

  const { incremental, syncRange } = opts;

  const kept = prevEvents.filter((e) => {
    if (!e.id.startsWith(GCAL_PREFIX)) return true;

    const occKey = recurringOccurrenceDedupeKey(e);
    if (occKey) {
      const winner = winnerByOccurrence.get(occKey);
      if (winner && e.id !== winner) return false;
    }

    if (!incremental && syncRange && eventIntersectsSyncRange(e, syncRange)) {
      return importedIds.has(e.id);
    }

    return true;
  });

  const byId = new Map(kept.map((ev) => [ev.id, ev]));
  for (const ev of imported) {
    const prev = byId.get(ev.id);
    const preservedColor =
      prev &&
      typeof (prev as { color?: string }).color === "string" &&
      (prev as { color?: string }).color
        ? (prev as { color: string }).color
        : undefined;
    const merged =
      preservedColor && !(ev as { color?: string }).color
        ? ({ ...ev, color: preservedColor } as CalendarEvent)
        : ev;
    byId.set(ev.id, withCoercedEventColor(merged));
  }
  return Array.from(byId.values());
}
