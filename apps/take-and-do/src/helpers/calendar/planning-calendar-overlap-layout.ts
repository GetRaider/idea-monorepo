import type { EventApi } from "@fullcalendar/core";

import type {
  CalendarEvent,
  CalendarKindVisibility,
} from "@/types/calendar.types";

/** Right-hand column when this event would hide a same-start peer's title/time. */
export const TAD_OVERLAP_SAME_START_COLUMN_CLASS =
  "tad-overlap-same-start-column";

export const TAD_EVENT_ID_ATTR = "data-tad-event-id";
export const TAD_WALL_START_ATTR = "data-tad-wall-start";
export const TAD_START_MS_ATTR = "data-tad-start-ms";
export const TAD_END_MS_ATTR = "data-tad-end-ms";

export type TimedEventInterval = {
  key: string;
  wallStart: string;
  start: Date;
  end: Date;
};

export function timedEventIntervalKey(id: string, start: Date): string {
  return `${id}::${start.getTime()}`;
}

export function wallClockStartKeyFromDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}T${hours}:${minutes}`;
}

export function wallClockStartKeyFromIso(iso: string): string {
  return wallClockStartKeyFromDate(new Date(iso));
}

export function intervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA.getTime() < endB.getTime() && startB.getTime() < endA.getTime();
}

export function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

/**
 * Narrow column only when this timed event starts with a strictly longer peer and
 * would cover its title/time at the top of the block.
 */
export function eventUsesSameStartColumnLayout(
  event: TimedEventInterval,
  peers: readonly TimedEventInterval[],
): boolean {
  for (const peer of peers) {
    if (peer.key === event.key) continue;
    if (!intervalsOverlap(event.start, event.end, peer.start, peer.end)) {
      continue;
    }
    if (event.wallStart !== peer.wallStart) continue;
    if (event.end.getTime() < peer.end.getTime()) {
      return true;
    }
  }
  return false;
}

export function applyTimegridHarnessOverlapLayout(
  harness: HTMLElement,
  sameStartColumn: boolean,
): void {
  harness.classList.toggle(
    TAD_OVERLAP_SAME_START_COLUMN_CLASS,
    sameStartColumn,
  );
  if (sameStartColumn) {
    harness.style.setProperty("left", "50%", "important");
    harness.style.setProperty("right", "0", "important");
    harness.style.setProperty("margin-left", "0", "important");
    harness.style.setProperty("margin-right", "0", "important");
    return;
  }
  harness.style.setProperty("left", "0", "important");
  harness.style.setProperty("right", "0", "important");
  harness.style.setProperty("margin-left", "0", "important");
  harness.style.setProperty("margin-right", "0", "important");
}

function sourceTimedInterval(event: CalendarEvent): TimedEventInterval {
  const start = new Date(event.start);
  const end = new Date(event.end);
  return {
    key: timedEventIntervalKey(event.id, start),
    wallStart: wallClockStartKeyFromIso(event.start),
    start,
    end,
  };
}

function buildSourceIntervals(
  sourceEvents: readonly CalendarEvent[],
  visibleKinds: CalendarKindVisibility,
): TimedEventInterval[] {
  return sourceEvents
    .filter((event) => !event.allDay && visibleKinds[event.type])
    .map(sourceTimedInterval);
}

export function findSourceEventForFcInstance(
  sourceEvents: readonly CalendarEvent[],
  fcId: string,
  fcStart: Date,
): CalendarEvent | undefined {
  const wallStart = wallClockStartKeyFromDate(fcStart);
  return sourceEvents.find((event) => {
    if (event.id !== fcId || event.allDay) return false;
    return wallClockStartKeyFromIso(event.start) === wallStart;
  });
}

export function stampTimegridEventEl(
  element: HTMLElement,
  opts: { id: string; wallStart: string; startMs: number; endMs: number },
): void {
  element.setAttribute(TAD_EVENT_ID_ATTR, opts.id);
  element.setAttribute(TAD_WALL_START_ATTR, opts.wallStart);
  element.setAttribute(TAD_START_MS_ATTR, String(opts.startMs));
  element.setAttribute(TAD_END_MS_ATTR, String(opts.endMs));
}

function readIntervalFromDom(
  eventElement: HTMLElement,
): TimedEventInterval | null {
  const marker =
    eventElement.querySelector(`[${TAD_START_MS_ATTR}]`) ?? eventElement;
  const eventId = marker.getAttribute(TAD_EVENT_ID_ATTR);
  const wallStart = marker.getAttribute(TAD_WALL_START_ATTR);
  const startMs = marker.getAttribute(TAD_START_MS_ATTR);
  const endMs = marker.getAttribute(TAD_END_MS_ATTR);
  if (!eventId || !wallStart || !startMs || !endMs) return null;

  const start = new Date(Number(startMs));
  const end = new Date(Number(endMs));
  return {
    key: timedEventIntervalKey(eventId, start),
    wallStart,
    start,
    end,
  };
}

function buildIntervalFromEventApi(
  event: EventApi,
  sourceEvents: readonly CalendarEvent[],
): TimedEventInterval | null {
  if (event.allDay || !event.start || !event.end) return null;

  const source = findSourceEventForFcInstance(
    sourceEvents,
    event.id,
    event.start,
  );
  const startIso = source?.start ?? event.start.toISOString();
  const endIso = source?.end ?? event.end.toISOString();
  const start = new Date(startIso);
  const end = new Date(endIso);
  return {
    key: timedEventIntervalKey(event.id, start),
    wallStart: wallClockStartKeyFromIso(startIso),
    start,
    end,
  };
}

function resolveTimedIntervalForHarness(
  eventElement: HTMLElement,
  sourceEvents: readonly CalendarEvent[],
  mountedEventApis?: readonly EventApi[],
): TimedEventInterval | null {
  const fromDom = readIntervalFromDom(eventElement);
  if (fromDom) return fromDom;

  if (mountedEventApis) {
    for (const event of mountedEventApis) {
      const element = (event as unknown as { el?: HTMLElement | null }).el;
      if (element !== eventElement) continue;
      return buildIntervalFromEventApi(event, sourceEvents);
    }
  }

  return null;
}

export function stampMountedEventApis(
  eventApis: readonly EventApi[],
  sourceEvents: readonly CalendarEvent[],
): void {
  for (const event of eventApis) {
    const element = (event as unknown as { el?: HTMLElement | null }).el;
    if (!element || element.classList.contains("fc-event-mirror")) continue;
    const interval = buildIntervalFromEventApi(event, sourceEvents);
    if (!interval) continue;
    stampTimegridEventEl(element, {
      id: event.id,
      wallStart: interval.wallStart,
      startMs: interval.start.getTime(),
      endMs: interval.end.getTime(),
    });
  }
}

export function repaintTimegridOverlapLayout(
  fcRoot: HTMLElement | null,
  sourceEvents: readonly CalendarEvent[],
  visibleKinds: CalendarKindVisibility,
  mountedEventApis?: readonly EventApi[],
): void {
  if (!fcRoot) return;

  if (mountedEventApis) {
    stampMountedEventApis(mountedEventApis, sourceEvents);
  }

  const sourceIntervals = buildSourceIntervals(sourceEvents, visibleKinds);
  const harnesses = fcRoot.querySelectorAll(".fc-timegrid-event-harness");

  for (const harness of harnesses) {
    if (!(harness instanceof HTMLElement)) continue;

    const eventElement = harness.querySelector(".fc-event");
    if (!(eventElement instanceof HTMLElement)) continue;
    if (eventElement.classList.contains("fc-event-mirror")) continue;

    const eventInterval = resolveTimedIntervalForHarness(
      eventElement,
      sourceEvents,
      mountedEventApis,
    );
    if (!eventInterval) continue;
    const peers = sourceIntervals.filter(
      (peer) =>
        peer.key !== eventInterval.key &&
        isSameLocalDay(peer.start, eventInterval.start),
    );
    const sameStartColumn = eventUsesSameStartColumnLayout(
      eventInterval,
      peers,
    );

    applyTimegridHarnessOverlapLayout(harness, sameStartColumn);
  }
}

let overlapLayoutObserver: MutationObserver | null = null;
let overlapLayoutObserverRoot: HTMLElement | null = null;

export function ensureTimegridOverlapLayoutObserver(
  fcRoot: HTMLElement | null,
  getContext: () => {
    sourceEvents: readonly CalendarEvent[];
    visibleKinds: CalendarKindVisibility;
    mountedEventApis: readonly EventApi[];
  },
): void {
  if (!fcRoot) return;
  if (overlapLayoutObserver && overlapLayoutObserverRoot === fcRoot) return;

  overlapLayoutObserver?.disconnect();
  overlapLayoutObserverRoot = fcRoot;

  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const { sourceEvents, visibleKinds, mountedEventApis } = getContext();
      repaintTimegridOverlapLayout(
        fcRoot,
        sourceEvents,
        visibleKinds,
        mountedEventApis,
      );
    });
  };

  overlapLayoutObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type !== "attributes" ||
        mutation.attributeName !== "style"
      ) {
        continue;
      }
      const target = mutation.target;
      if (
        target instanceof HTMLElement &&
        target.classList.contains("fc-timegrid-event-harness")
      ) {
        schedule();
        return;
      }
    }
  });

  overlapLayoutObserver.observe(fcRoot, {
    subtree: true,
    attributes: true,
    attributeFilter: ["style"],
  });
}

/** FullCalendar re-applies harness geometry after mount; keep repainting like stripe colors. */
export function scheduleRepaintTimegridOverlapLayout(
  fcRoot: HTMLElement | null,
  sourceEvents: readonly CalendarEvent[],
  visibleKinds: CalendarKindVisibility,
  mountedEventApis?: readonly EventApi[],
): void {
  const paint = () =>
    repaintTimegridOverlapLayout(
      fcRoot,
      sourceEvents,
      visibleKinds,
      mountedEventApis,
    );

  paint();
  requestAnimationFrame(() => {
    paint();
    requestAnimationFrame(paint);
  });
  window.setTimeout(paint, 0);
  window.setTimeout(paint, 32);
  window.setTimeout(paint, 100);
  window.setTimeout(paint, 220);
  window.setTimeout(paint, 400);
}
