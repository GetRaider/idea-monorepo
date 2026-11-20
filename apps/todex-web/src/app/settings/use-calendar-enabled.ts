"use client";

import { useQuery } from "@tanstack/react-query";

import { todexClient } from "@lib/todex-client";

export const USER_PREFERENCES_KEY = ["user-preferences"] as const;

export function useUserPreferences() {
  return useQuery({
    queryKey: USER_PREFERENCES_KEY,
    queryFn: () => todexClient.preferences.get(),
  });
}

export function useCalendarEnabled() {
  const preferences = useUserPreferences();
  return {
    enabled: preferences.data?.calendarEnabled === true,
    isPending: preferences.isPending,
  };
}
