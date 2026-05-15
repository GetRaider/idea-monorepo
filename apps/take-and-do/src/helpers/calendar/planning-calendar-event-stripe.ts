export const TAD_EVENT_STRIPE_PX = 5;

export function applyTadEventStripeToEl(
  el: HTMLElement,
  opts: {
    useStripe: boolean;
    baseColor: string;
    bodyFill: string;
  },
) {
  const { useStripe, baseColor, bodyFill } = opts;
  const on = useStripe && baseColor && bodyFill;
  if (on) {
    el.classList.add("tad-event-calendar-stripe");
    el.style.setProperty("--tad-event-base-color", baseColor);
    el.style.setProperty("--tad-event-body-fill", bodyFill);
    el.style.setProperty("--tad-event-stripe-w", `${TAD_EVENT_STRIPE_PX}px`);
  } else {
    el.classList.remove("tad-event-calendar-stripe");
    el.style.removeProperty("--tad-event-base-color");
    el.style.removeProperty("--tad-event-body-fill");
    el.style.removeProperty("--tad-event-stripe-w");
  }
}

export function scheduleTadEventStripePaint(
  el: HTMLElement,
  opts: { useStripe: boolean; baseColor: string; bodyFill: string },
) {
  const paint = () => applyTadEventStripeToEl(el, opts);
  paint();
  requestAnimationFrame(() => {
    paint();
    requestAnimationFrame(paint);
  });
  window.setTimeout(paint, 0);
  window.setTimeout(paint, 32);
  window.setTimeout(paint, 100);
  /** FC may re-apply inline `backgroundColor` after `eventsSet` / layout; late pass restores CSS vars. */
  window.setTimeout(paint, 220);
}
