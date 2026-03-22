"use client";

import { useEffect } from "react";

import { initMixpanel } from "@/lib/analytics";

export function Analytics() {
  useEffect(() => {
    initMixpanel();
  }, []);
  return null;
}
