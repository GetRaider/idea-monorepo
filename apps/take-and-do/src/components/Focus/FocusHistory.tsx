"use client";

import { useMemo, type ReactNode } from "react";

import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import {
  formatFocusDurationLabel,
  formatFocusHistoryTimestamp,
  getFocusHistoryStatusLabel,
  getFocusSessionDurationLabel,
  isFocusSessionRecord,
  resolveBreakParentName,
  sortFocusHistorySessions,
} from "@/helpers/focus/focus-session.helper";
import { cn } from "@/lib/styles/utils";

import { FocusCollapsibleSection } from "./FocusCollapsibleSection";

import type {
  BreakSession,
  FocusSession,
  FocusSessionRecord,
} from "@/types/focus.types";

export function FocusHistory() {
  const { sessions } = useFocusSessionContext();
  const historySessions = useMemo(
    () => sortFocusHistorySessions(sessions),
    [sessions],
  );

  return (
    <FocusCollapsibleSection title="History" defaultExpanded={false}>
      {historySessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center">
          <p className="m-0 text-xs text-text-secondary">
            Completed and interrupted sessions will appear here.
          </p>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {historySessions.map((session) => (
            <li key={session.id}>
              {isFocusSessionRecord(session) ? (
                <FocusHistoryFocusRow session={session} />
              ) : (
                <FocusHistoryBreakRow
                  session={session}
                  allSessions={historySessions}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </FocusCollapsibleSection>
  );
}

function FocusHistoryFocusRow({ session }: { session: FocusSession }) {
  return (
    <FocusHistoryRowShell variant="focus">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="m-0 truncate text-sm font-semibold text-text-primary">
            {session.name}
          </p>
          <FocusHistoryTypeBadge variant="focus">Focus</FocusHistoryTypeBadge>
        </div>
        <p className="m-0 text-xs text-text-secondary">
          {getFocusSessionDurationLabel(session)} ·{" "}
          {formatFocusDurationLabel(session.actualDurationSeconds)} recorded
        </p>
        <p className="m-0 text-xs text-text-tertiary">
          {formatFocusHistoryTimestamp(session.endedAt)}
        </p>
      </div>
      <FocusHistoryStatusBadge status={session.status} />
    </FocusHistoryRowShell>
  );
}

function FocusHistoryBreakRow({
  session,
  allSessions,
}: {
  session: BreakSession;
  allSessions: FocusSessionRecord[];
}) {
  const parentName = resolveBreakParentName(session, allSessions);

  return (
    <FocusHistoryRowShell variant="break">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="m-0 truncate text-sm font-semibold text-text-primary">
            Break
          </p>
          <FocusHistoryTypeBadge variant="break">Break</FocusHistoryTypeBadge>
        </div>
        <p className="m-0 text-xs text-text-secondary">
          {parentName ? `After ${parentName} · ` : ""}
          {formatFocusDurationLabel(session.actualDurationSeconds)} recorded
        </p>
        <p className="m-0 text-xs text-text-tertiary">
          {formatFocusHistoryTimestamp(session.endedAt)}
        </p>
      </div>
      <FocusHistoryStatusBadge status={session.status} />
    </FocusHistoryRowShell>
  );
}

function FocusHistoryRowShell({
  variant,
  children,
}: {
  variant: "focus" | "break";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3",
        variant === "focus"
          ? "border-l-4 border-l-emerald-400/70"
          : "border-l-4 border-l-sky-400/70 bg-sky-500/[0.03]",
      )}
    >
      {children}
    </div>
  );
}

function FocusHistoryTypeBadge({
  variant,
  children,
}: {
  variant: "focus" | "break";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        variant === "focus"
          ? "bg-emerald-400/10 text-emerald-300"
          : "bg-sky-400/10 text-sky-300",
      )}
    >
      {children}
    </span>
  );
}

function FocusHistoryStatusBadge({
  status,
}: {
  status: FocusSession["status"];
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-md px-2 py-1 text-xs font-medium",
        status === "completed"
          ? "bg-white/5 text-text-secondary"
          : "bg-amber-500/10 text-amber-200",
      )}
    >
      {getFocusHistoryStatusLabel(status)}
    </span>
  );
}
