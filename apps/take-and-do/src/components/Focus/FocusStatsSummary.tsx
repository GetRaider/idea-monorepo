"use client";

import { useMemo } from "react";

import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import {
  formatFocusDurationLabel,
  getDailyFocusSeconds,
  getWeeklyFocusSeconds,
} from "@/helpers/focus/focus-session.helper";

import type { FocusSessionRecord } from "@/types/focus.types";

export function FocusStatsSummary({
  sessionsOverride,
}: FocusStatsSummaryProps) {
  const { sessions: contextSessions, weeklyFocusSeconds } =
    useFocusSessionContext();
  const sessions = sessionsOverride ?? contextSessions;

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

function FocusStatLine({ label, value }: FocusStatLineProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="m-0 text-xs text-text-secondary">{label}</p>
      <p className="m-0 text-xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}

interface FocusStatLineProps {
  label: string;
  value: string;
}

interface FocusStatsSummaryProps {
  sessionsOverride?: FocusSessionRecord[];
}
