import mixpanel from "mixpanel-browser";

let initialized = false;

export function initMixpanel() {
  if (initialized || typeof window === "undefined") return;
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return;
  mixpanel.init(token, {
    debug: process.env.NODE_ENV === "development",
    track_pageview: true,
    persistence: "localStorage",
  });
  initialized = true;
}

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  initMixpanel();
  if (!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) return;
  mixpanel.track(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  initMixpanel();
  if (!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) return;
  mixpanel.identify(userId);
  if (traits) mixpanel.people.set(traits);
}
