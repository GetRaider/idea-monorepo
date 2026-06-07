import type { CalendarApi, EventApi } from "@fullcalendar/core";

import {
  scheduledToEventInput,
  type CalendarEventColorTheme,
} from "@/helpers/calendar/calendar-event-mapper";
import { scheduleTadEventStripePaint } from "@/helpers/calendar/planning-calendar-event-stripe";
import type {
  CalendarEvent,
  CalendarKindVisibility,
} from "@/types/calendar.types";

type ScheduledEventExtendedProps = {
  eventBodyFill: string;
  eventCalendarBaseColor: string;
  useCalendarStripe: boolean;
};

let applyingScheduledEventColors = false;

/** Stable fingerprint so layout effects run when any event color changes. */
export function planningCalendarEventColorFingerprint(
  events: CalendarEvent[],
): string {
  return events.map((event) => `${event.id}\0${event.color ?? ""}`).join("\n");
}

export function calendarEventsLayoutSignature(events: CalendarEvent[]): string {
  return events
    .map(
      (event) =>
        `${event.id}\0${event.start}\0${event.end}\0${event.color ?? ""}`,
    )
    .join("\n");
}

function scheduledColorsMatchFullCalendar(
  fcEvent: EventApi,
  input: ReturnType<typeof scheduledToEventInput>,
  extendedProps: ScheduledEventExtendedProps,
): boolean {
  const backgroundColor = input.backgroundColor ?? "";
  if (fcEvent.backgroundColor !== backgroundColor) return false;
  if (
    (fcEvent.borderColor ?? backgroundColor) !==
    (input.borderColor ?? backgroundColor)
  ) {
    return false;
  }
  if (fcEvent.extendedProps.eventBodyFill !== extendedProps.eventBodyFill) {
    return false;
  }
  if (
    fcEvent.extendedProps.eventCalendarBaseColor !==
    extendedProps.eventCalendarBaseColor
  ) {
    return false;
  }
  return true;
}

/**
 * FullCalendar reuses DOM nodes when `events` updates; push fresh fill/stripe into FC
 * props and CSS vars so per-event colors apply without a page refresh.
 *
 * Skips `setProp` when values are unchanged — otherwise `eventsSet` ↔ `setProp` loops.
 */
export function applyScheduledEventColorsToFullCalendar(
  api: CalendarApi,
  events: CalendarEvent[],
  visibleKinds: CalendarKindVisibility,
  theme?: CalendarEventColorTheme,
): void {
  if (applyingScheduledEventColors) return;
  applyingScheduledEventColors = true;
  try {
    for (const source of events) {
      if (!visibleKinds[source.type]) continue;
      const fcEvent = api.getEventById(source.id);
      if (!fcEvent) continue;

      const input = scheduledToEventInput(source, theme);
      const extendedProps = input.extendedProps as ScheduledEventExtendedProps;
      const colorsMatch = scheduledColorsMatchFullCalendar(
        fcEvent,
        input,
        extendedProps,
      );

      if (!colorsMatch) {
        if (input.backgroundColor) {
          fcEvent.setProp("backgroundColor", input.backgroundColor);
          fcEvent.setProp(
            "borderColor",
            input.borderColor ?? input.backgroundColor,
          );
        }
        fcEvent.setExtendedProp("eventBodyFill", extendedProps.eventBodyFill);
        fcEvent.setExtendedProp(
          "eventCalendarBaseColor",
          extendedProps.eventCalendarBaseColor,
        );
      }

      const element = (fcEvent as unknown as { el?: HTMLElement | null }).el;
      if (!element || element.classList.contains("fc-event-mirror")) continue;

      scheduleTadEventStripePaint(element, {
        useStripe: extendedProps.useCalendarStripe,
        baseColor: extendedProps.eventCalendarBaseColor,
        bodyFill: extendedProps.eventBodyFill,
      });
    }
  } finally {
    queueMicrotask(() => {
      applyingScheduledEventColors = false;
    });
  }
}
