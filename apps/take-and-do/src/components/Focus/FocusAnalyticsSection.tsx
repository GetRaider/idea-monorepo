"use client";

import { useMemo, useState } from "react";

import { Dropdown } from "@/components/Dropdown";
import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import { isFocusSessionRecord } from "@/helpers/focus/focus-session.helper";
import { cn } from "@/lib/styles/utils";
import { chromePrimaryButtonClassName } from "@/lib/styles/chrome-primary-button-classes";

import { FocusActivityHeatmap } from "./FocusActivityHeatmap";
import { FocusCollapsibleSection } from "./FocusCollapsibleSection";
import { FocusStatsSummary } from "./FocusStatsSummary";

const ALL_SESSIONS_VALUE = "";

export function FocusAnalyticsSection() {
  const { sessions } = useFocusSessionContext();
  const [selectedSessionName, setSelectedSessionName] =
    useState(ALL_SESSIONS_VALUE);

  const sessionNameOptions = useMemo(() => {
    const names = new Set<string>();
    sessions.filter(isFocusSessionRecord).forEach((session) => {
      if (session.name.trim()) names.add(session.name.trim());
    });
    return [
      { value: ALL_SESSIONS_VALUE, label: "All sessions" },
      ...[...names].sort().map((name) => ({ value: name, label: name })),
    ];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (!selectedSessionName) return sessions;
    return sessions.filter(
      (session) =>
        isFocusSessionRecord(session) &&
        session.name.trim() === selectedSessionName,
    );
  }, [selectedSessionName, sessions]);

  const selectedLabel =
    sessionNameOptions.find((option) => option.value === selectedSessionName)
      ?.label ?? "All sessions";

  return (
    <FocusCollapsibleSection title="Analytics" defaultExpanded={false}>
      <div className="flex flex-col gap-4">
        <Dropdown
          options={sessionNameOptions}
          value={selectedSessionName}
          onChange={setSelectedSessionName}
          trigger={
            <span
              className={cn(
                chromePrimaryButtonClassName,
                "inline-flex w-full max-w-xs items-center justify-center px-5 py-2.5 text-sm font-semibold",
              )}
            >
              {selectedLabel}
            </span>
          }
          fullWidth
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FocusActivityHeatmap
            embedded
            weekCount={12}
            sessionsOverride={filteredSessions}
          />
          <FocusStatsSummary sessionsOverride={filteredSessions} />
        </div>
      </div>
    </FocusCollapsibleSection>
  );
}
