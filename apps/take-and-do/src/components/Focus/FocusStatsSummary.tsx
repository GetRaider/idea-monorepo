"use client";

import { useMemo } from "react";

import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import {
  formatFocusDurationLabel,
  getDailyFocusSeconds,
  getMonthlyFocusSeconds,
  getTotalFocusSeconds,
  getWeeklyFocusSeconds,
} from "@/helpers/focus/focus-session.helper";
import { cn } from "@/lib/styles/utils";

import type { FocusSessionRecord } from "@/types/focus.types";

export function FocusStatsSummary({
  sessionsOverride,
  variant = "default",
}: FocusStatsSummaryProps) {
  const { sessions: contextSessions, weeklyFocusSeconds } =
    useFocusSessionContext();
  const sessions = sessionsOverride ?? contextSessions;

  const totalSeconds = useMemo(
    () => getTotalFocusSeconds(sessions),
    [sessions],
  );

  const todaySeconds = useMemo(
    () => getDailyFocusSeconds(sessions),
    [sessions],
  );

  const weekSeconds = useMemo(() => {
    if (sessionsOverride) {
      return getWeeklyFocusSeconds(sessions);
    }
    return weeklyFocusSeconds;
  }, [sessions, sessionsOverride, weeklyFocusSeconds]);

  const monthSeconds = useMemo(
    () => getMonthlyFocusSeconds(sessions),
    [sessions],
  );

  const isAnalytics = variant === "analytics";

  if (isAnalytics) {
    return (
      <div className="grid h-full grid-cols-2 gap-3">
        <FocusStatCard
          label="Total"
          value={formatFocusDurationLabel(totalSeconds)}
        />
        <FocusStatCard
          label="This Week"
          value={formatFocusDurationLabel(weekSeconds)}
        />
        <FocusStatCard
          label="Today"
          value={formatFocusDurationLabel(todaySeconds)}
        />
        <FocusStatCard
          label="This Month"
          value={formatFocusDurationLabel(monthSeconds)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-5">
      <FocusStatLine
        label="Today"
        value={formatFocusDurationLabel(todaySeconds)}
      />
      <FocusStatLine
        label="This Week"
        value={formatFocusDurationLabel(weekSeconds)}
      />
    </div>
  );
}

function FocusStatCard({ label, value }: FocusStatLineProps) {
  return (
    <div className="flex flex-col justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
      <FocusStatLine label={label} value={value} large />
    </div>
  );
}

function FocusStatLine({ label, value, large = false }: FocusStatLineProps) {
  return (
    <div className="flex flex-col gap-1">
      <p
        className={cn("m-0 text-text-secondary", large ? "text-sm" : "text-xs")}
      >
        {label}
      </p>
      <p className="m-0 text-xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}

interface FocusStatLineProps {
  label: string;
  value: string;
  large?: boolean;
}

interface FocusStatsSummaryProps {
  sessionsOverride?: FocusSessionRecord[];
  variant?: "default" | "analytics";
}
