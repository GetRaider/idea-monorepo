"use client";

import { useEffect } from "react";

import { mixpanelAnalytics } from "@/lib/analytics/maxpanel-analytics";

export function Analytics() {
  useEffect(() => {
    mixpanelAnalytics.init();
  }, []);
  return null;
}
