import type { CalendarBlock, CalendarMode } from "./calendar-blocks";

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

export function lanePlacements(
  blocks: readonly CalendarBlock[],
  mode: CalendarMode,
): Map<string, HarnessPlacement> {
  const placements = new Map<string, HarnessPlacement>();
  const byDay = new Map<string, CalendarBlock[]>();
  for (const block of blocks) {
    if (block.allDay) {
      const half = mode === "both";
      placements.set(block.key, {
        left: half && block.lane === "actual" ? "50%" : "0%",
        width: half ? "50%" : "100%",
      });
      continue;
    }
    const key = localDayKey(block.start);
    const day = byDay.get(key) ?? [];
    day.push(block);
    byDay.set(key, day);
  }
  for (const day of byDay.values()) {
    const laneNames =
      mode === "both"
        ? (["planned", "actual"] as const)
        : [...new Set(day.map((block) => block.lane))];
    for (const lane of laneNames) {
      const packed = packLane(day.filter((block) => block.lane === lane));
      const laneIndex = mode === "both" ? (lane === "planned" ? 0 : 1) : 0;
      const laneCount = mode === "both" ? 2 : 1;
      for (const item of packed) {
        const laneWidth = 100 / laneCount;
        const width = laneWidth / item.columns;
        const left = laneIndex * laneWidth + item.column * width;
        placements.set(item.key, {
          left: `${roundPercent(left)}%`,
          width: `${roundPercent(width)}%`,
        });
      }
    }
  }
  return placements;
}

export function stampHarnessEvent(element: HTMLElement, eventId: string) {
  element.setAttribute(EVENT_ID_ATTR, eventId);
  element
    .closest(".fc-timegrid-event-harness, .fc-daygrid-event-harness")
    ?.setAttribute(EVENT_ID_ATTR, eventId);
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
  mode: CalendarMode,
): void {
  if (!root) return;
  const placements = lanePlacements(blocks, mode);
  const harnesses = root.querySelectorAll(
    ".fc-timegrid-event-harness, .fc-daygrid-event-harness",
  );
  for (const harness of harnesses) {
    if (!(harness instanceof HTMLElement)) continue;
    const eventElement = harness.querySelector(".fc-event");
    if (!(eventElement instanceof HTMLElement)) continue;
    if (eventElement.classList.contains("fc-event-mirror")) continue;
    const eventId = readEventId(harness) ?? readEventId(eventElement);
    if (!eventId) continue;
    const placement = placements.get(eventId);
    if (!placement) continue;
    applyHarnessLayout(harness, placement.left, placement.width);
  }
}

export function scheduleRepaintTimegridOverlapLayout(
  root: HTMLElement | null,
  blocks: readonly CalendarBlock[],
  mode: CalendarMode,
): void {
  const paint = () => repaintTimegridOverlapLayout(root, blocks, mode);
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
  getMode: () => CalendarMode,
): void {
  if (!root) return;
  if (overlapObserver && overlapObserverRoot === root) return;
  overlapObserver?.disconnect();
  overlapObserverRoot = root;
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() =>
      repaintTimegridOverlapLayout(root, getBlocks(), getMode()),
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
        (target.classList.contains("fc-timegrid-event-harness") ||
          target.classList.contains("fc-daygrid-event-harness"))
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

function packLane(blocks: readonly CalendarBlock[]) {
  const groups = new Map<string, CalendarBlock[]>();
  const singles: CalendarBlock[] = [];
  for (const block of blocks) {
    if (!block.sessionId) {
      singles.push(block);
      continue;
    }
    const group = groups.get(block.sessionId) ?? [];
    group.push(block);
    groups.set(block.sessionId, group);
  }
  const items: PackItem[] = singles.map((block) => ({
    keys: [block.key],
    start: block.start.getTime(),
    end: block.end.getTime(),
  }));
  for (const group of groups.values()) {
    items.push({
      keys: group.map((block) => block.key),
      start: Math.min(...group.map((block) => block.start.getTime())),
      end: Math.max(...group.map((block) => block.end.getTime())),
    });
  }
  const sorted = [...items].sort((left, right) => left.start - right.start);
  const columnEnds: number[] = [];
  const placed: { keys: string[]; column: number; start: number; end: number }[] =
    [];
  for (const item of sorted) {
    let column = columnEnds.findIndex((end) => end <= item.start);
    if (column < 0) {
      column = columnEnds.length;
      columnEnds.push(item.end);
    } else {
      columnEnds[column] = item.end;
    }
    placed.push({ ...item, column });
  }
  return placed.flatMap((item) => {
    const columns =
      placed.reduce((highest, peer) => {
        if (peer.start >= item.end || item.start >= peer.end) return highest;
        return Math.max(highest, peer.column + 1);
      }, 1) || 1;
    return item.keys.map((key) => ({ key, column: item.column, columns }));
  });
}

function applyHarnessLayout(harness: HTMLElement, left: string, width: string) {
  harness.dataset.todexPlaced = "true";
  harness.style.setProperty("--todex-harness-left", left);
  harness.style.setProperty("--todex-harness-width", width);
}

function readEventId(eventElement: HTMLElement) {
  return (
    eventElement.getAttribute(EVENT_ID_ATTR) ??
    eventElement.querySelector(`[${EVENT_ID_ATTR}]`)?.getAttribute(EVENT_ID_ATTR) ??
    null
  );
}

function localDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function roundPercent(value: number) {
  return Math.round(value * 1000) / 1000;
}

let overlapObserver: MutationObserver | null = null;
let overlapObserverRoot: HTMLElement | null = null;

interface HarnessPlacement {
  left: string;
  width: string;
}

interface PackItem {
  keys: string[];
  start: number;
  end: number;
}
