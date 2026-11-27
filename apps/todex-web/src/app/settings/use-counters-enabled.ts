"use client";

import { useUserPreferences } from "./use-calendar-enabled";

export function useCountersEnabled() {
  const preferences = useUserPreferences();
  return {
    enabled: preferences.data?.countersEnabled === true,
    isPending: preferences.isPending,
  };
}
