export function findTimegridBodyScroller(
  fcRoot: HTMLElement,
): HTMLElement | null {
  const body = fcRoot.querySelector(".fc-timegrid-body");
  if (!body) return null;
  const scrollers = body.querySelectorAll(".fc-scroller");
  let best: HTMLElement | null = null;
  let bestOverflow = 0;
  for (const el of scrollers) {
    if (!(el instanceof HTMLElement)) continue;
    const overflow = el.scrollHeight - el.clientHeight;
    if (overflow > bestOverflow) {
      bestOverflow = overflow;
      best = el;
    }
  }
  if (best) return best;
  const first = scrollers[0];
  return first instanceof HTMLElement ? first : null;
}

/** Prefer the now line in today’s time column inside the slot body (not header / all-day). */
export function findTimegridNowLineEl(fcRoot: HTMLElement): HTMLElement | null {
  const body = fcRoot.querySelector(".fc-timegrid-body");
  if (!body) return null;
  const inToday = body.querySelector(
    ".fc-day-today .fc-timegrid-now-indicator-line",
  ) as HTMLElement | null;
  if (inToday) return inToday;
  return body.querySelector(
    ".fc-timegrid-now-indicator-line",
  ) as HTMLElement | null;
}

/**
 * Walks up from the now line to find the vertical scroll container that actually
 * moves the slots (FC nests multiple `.fc-scroller` nodes — picking by overflow alone
 * can target the wrong one, which leaves “now” pinned to the top after scrollToTime).
 */
export function findSlotScrollParent(
  fcRoot: HTMLElement,
  from: HTMLElement,
): HTMLElement | null {
  let p: HTMLElement | null = from;
  let best: HTMLElement | null = null;
  let bestArea = 0;
  while (p && fcRoot.contains(p)) {
    const delta = p.scrollHeight - p.clientHeight;
    if (delta > 2) {
      const oy = getComputedStyle(p).overflowY;
      const fcScroller = p.classList.contains("fc-scroller");
      if (oy === "auto" || oy === "scroll" || fcScroller) {
        const area = p.clientWidth * p.clientHeight;
        if (area > bestArea) {
          bestArea = area;
          best = p;
        }
      }
    }
    p = p.parentElement;
  }
  return best;
}

/** Returns false if the now line is not in the DOM yet (retry on the next frame). */
export function alignNowLineToVerticalCenter(fcRoot: HTMLElement): boolean {
  const nowLine = findTimegridNowLineEl(fcRoot);
  if (!nowLine) return false;
  const scroller =
    findSlotScrollParent(fcRoot, nowLine) ?? findTimegridBodyScroller(fcRoot);
  if (!scroller) return false;

  for (let pass = 0; pass < 4; pass++) {
    const sRect = scroller.getBoundingClientRect();
    const nRect = nowLine.getBoundingClientRect();
    const lineCenter = nRect.top + nRect.height / 2;
    const scrollerCenter = sRect.top + scroller.clientHeight / 2;
    const delta = lineCenter - scrollerCenter;
    if (Math.abs(delta) < 3) return true;
    scroller.scrollTop += delta;
  }
  return true;
}
