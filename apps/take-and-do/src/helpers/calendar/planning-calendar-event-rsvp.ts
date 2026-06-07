const RSVP_NO_CLASS = "tad-event-rsvp-no";
const RSVP_MAYBE_CLASS = "tad-event-rsvp-maybe";

export function applyTadEventRsvpClasses(
  el: HTMLElement,
  rsvpStatus: unknown,
): void {
  el.classList.remove(RSVP_NO_CLASS, RSVP_MAYBE_CLASS);
  if (rsvpStatus === "no") el.classList.add(RSVP_NO_CLASS);
  else if (rsvpStatus === "maybe") el.classList.add(RSVP_MAYBE_CLASS);
}

export function scheduleTadEventRsvpPaint(
  el: HTMLElement,
  rsvpStatus: unknown,
): void {
  const paint = () => applyTadEventRsvpClasses(el, rsvpStatus);
  paint();
  requestAnimationFrame(() => {
    paint();
    requestAnimationFrame(paint);
  });
}
