"use client";

import { useMemo, useState } from "react";

import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import { FOCUS_ANALYTICS_WEEK_COUNT } from "@/helpers/focus/focus-heatmap.helper";
import {
  buildFocusSessionFilterOptions,
  isFocusSessionRecord,
} from "@/helpers/focus/focus-session.helper";

import { FocusActivityHeatmap } from "./FocusActivityHeatmap";
import { FocusCollapsibleSection } from "./FocusCollapsibleSection";
import { FocusSessionSelect } from "./FocusSessionSelect";
import { FocusStatsSummary } from "./FocusStatsSummary";

const ALL_SESSIONS_VALUE = "";

export function FocusAnalyticsSection() {
  const { sessions } = useFocusSessionContext();
  const [selectedSessionName, setSelectedSessionName] =
    useState(ALL_SESSIONS_VALUE);

  const sessionOptions = useMemo(
    () => buildFocusSessionFilterOptions(sessions),
    [sessions],
  );

  const filteredSessions = useMemo(() => {
    if (!selectedSessionName) return sessions;
    return sessions.filter(
      (session) =>
        isFocusSessionRecord(session) &&
        session.name.trim() === selectedSessionName,
    );
  }, [selectedSessionName, sessions]);

  return (
    <FocusCollapsibleSection
      title="Analytics"
      defaultExpanded={false}
      headerActions={(expanded) => (
        <FocusSessionSelect
          size="compact"
          disabled={!expanded}
          options={sessionOptions}
          value={selectedSessionName}
          onChange={setSelectedSessionName}
          placeholder="Select Session"
        />
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <div className="min-w-0 flex-[3]">
          <FocusActivityHeatmap
            size="analytics"
            weekCount={FOCUS_ANALYTICS_WEEK_COUNT}
            sessionNameFilter={selectedSessionName || null}
          />
        </div>

        <div
          className="hidden w-px shrink-0 self-stretch bg-white/10 lg:block"
          aria-hidden
        />

        <div className="min-w-0 flex-[2]">
          <FocusStatsSummary
            variant="analytics"
            sessionsOverride={filteredSessions}
          />
        </div>
      </div>
    </FocusCollapsibleSection>
  );
}
