"use client";

import { useEffect } from "react";

import { initMixpanel } from "@/lib/maxpanel-analytics";

export function Analytics() {
  useEffect(() => {
    initMixpanel();
  }, []);
  return null;
}
