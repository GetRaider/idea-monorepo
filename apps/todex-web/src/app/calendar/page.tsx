"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useCalendarEnabled } from "../settings/use-calendar-enabled";

export default function CalendarRedirectPage() {
  const router = useRouter();
  const { enabled, isPending } = useCalendarEnabled();

  useEffect(() => {
    if (isPending) return;
    router.replace(enabled ? "/planning/calendar" : "/overview");
  }, [enabled, isPending, router]);

  return null;
}
