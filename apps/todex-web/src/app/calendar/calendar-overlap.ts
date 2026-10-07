import type { CalendarBlock } from "./calendar-blocks";

export const OVERLAP_SAME_START_COLUMN_CLASS = "todex-overlap-same-start-column";

const EVENT_ID_ATTR = "data-todex-event-id";
const WALL_START_ATTR = "data-todex-wall-start";
const START_MS_ATTR = "data-todex-start-ms";
const END_MS_ATTR = "data-todex-end-ms";

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

export function eventUsesSameStartColumnLayout(
  event: TimedEventInterval,
  peers: readonly TimedEventInterval[],
): boolean {
  for (const peer of peers) {
    if (peer.key === event.key) continue;
    if (!intervalsOverlap(event.start, event.end, peer.start, peer.end)) continue;
    if (event.wallStart !== peer.wallStart) continue;
    if (event.end.getTime() < peer.end.getTime()) return true;
  }
  return false;
}

export function overlapStamp(block: CalendarBlock): Record<string, string> {
  if (block.allDay) return {};
  return {
    [EVENT_ID_ATTR]: block.key,
    [WALL_START_ATTR]: wallClockStartKeyFromDate(block.start),
    [START_MS_ATTR]: String(block.start.getTime()),
    [END_MS_ATTR]: String(block.end.getTime()),
  };
}

export function repaintTimegridOverlapLayout(
  root: HTMLElement | null,
  blocks: readonly CalendarBlock[],
): void {
  if (!root) return;
  const intervals = blocks.filter((block) => !block.allDay).map(intervalFromBlock);
  const harnesses = root.querySelectorAll(".fc-timegrid-event-harness");
  for (const harness of harnesses) {
    if (!(harness instanceof HTMLElement)) continue;
    const eventElement = harness.querySelector(".fc-event");
    if (!(eventElement instanceof HTMLElement)) continue;
    if (eventElement.classList.contains("fc-event-mirror")) continue;
    const eventInterval = readInterval(eventElement);
    if (!eventInterval) continue;
    const peers = intervals.filter(
      (peer) =>
        peer.key !== eventInterval.key &&
        isSameLocalDay(peer.start, eventInterval.start),
    );
    applyHarnessLayout(
      harness,
      eventUsesSameStartColumnLayout(eventInterval, peers),
    );
  }
}

export function scheduleRepaintTimegridOverlapLayout(
  root: HTMLElement | null,
  blocks: readonly CalendarBlock[],
): void {
  const paint = () => repaintTimegridOverlapLayout(root, blocks);
  paint();
  requestAnimationFrame(() => {
    paint();
    requestAnimationFrame(paint);
  });
  window.setTimeout(paint, 0);
  window.setTimeout(paint, 32);
  window.setTimeout(paint, 100);
}

export function ensureTimegridOverlapLayoutObserver(
  root: HTMLElement | null,
  getBlocks: () => readonly CalendarBlock[],
): void {
  if (!root) return;
  if (overlapObserver && overlapObserverRoot === root) return;
  overlapObserver?.disconnect();
  overlapObserverRoot = root;
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() =>
      repaintTimegridOverlapLayout(root, getBlocks()),
    );
  };
  overlapObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "attributes" || mutation.attributeName !== "style") {
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
  overlapObserver.observe(root, {
    subtree: true,
    attributes: true,
    attributeFilter: ["style"],
  });
}

function applyHarnessLayout(harness: HTMLElement, sameStartColumn: boolean) {
  harness.classList.toggle(OVERLAP_SAME_START_COLUMN_CLASS, sameStartColumn);
  harness.style.setProperty("left", sameStartColumn ? "50%" : "0", "important");
  harness.style.setProperty("right", "0", "important");
  harness.style.setProperty("margin-left", "0", "important");
  harness.style.setProperty("margin-right", "0", "important");
  harness.style.setProperty("z-index", sameStartColumn ? "5" : "1", "important");
}

function intervalFromBlock(block: CalendarBlock): TimedEventInterval {
  return {
    key: timedEventIntervalKey(block.key, block.start),
    wallStart: wallClockStartKeyFromDate(block.start),
    start: block.start,
    end: block.end,
  };
}

function readInterval(eventElement: HTMLElement): TimedEventInterval | null {
  const marker = eventElement.querySelector(`[${START_MS_ATTR}]`) ?? eventElement;
  const eventId = marker.getAttribute(EVENT_ID_ATTR);
  const wallStart = marker.getAttribute(WALL_START_ATTR);
  const startMs = marker.getAttribute(START_MS_ATTR);
  const endMs = marker.getAttribute(END_MS_ATTR);
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

let overlapObserver: MutationObserver | null = null;
let overlapObserverRoot: HTMLElement | null = null;

interface TimedEventInterval {
  key: string;
  wallStart: string;
  start: Date;
  end: Date;
}
