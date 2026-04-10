import mixpanel from "mixpanel-browser";

class MixpanelAnalytics {
  private initialized = false;
  private token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  private mixpanel = mixpanel;

  constructor() {
    this.initialized = false;
    this.token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    this.mixpanel = mixpanel;
  }

  init() {
    if (this.initialized) return;
    if (!this.token) return;
    this.mixpanel.init(this.token, {
      debug: process.env.NODE_ENV === "development",
    });
    this.initialized = true;
  }

  trackEvent(event: string, properties?: Record<string, unknown>) {
    if (!this.initialized) return;
    this.mixpanel.track(event, properties);
  }

  identifyUser(userId: string, traits?: Record<string, unknown>) {
    if (!this.initialized) return;
    this.mixpanel.identify(userId);
    if (traits) this.mixpanel.people.set(traits);
  }
}

export const mixpanelAnalytics = new MixpanelAnalytics();
