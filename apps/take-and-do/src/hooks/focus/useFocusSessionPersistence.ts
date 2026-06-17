"use client";

import { useCallback } from "react";

import {
  buildBreakSessionRecord,
  buildFocusSessionRecord,
  isActiveBreakTimer,
  withActiveTimerSystemState,
} from "@/helpers/focus/focus-session.helper";
import { clientServices } from "@/services";
import {
  appendFocusSessionRecord,
  writeFocusBreakSuggestion,
  writeFocusActiveTimer,
  writeFocusDraft,
} from "@/hooks/focus/focus-storage";

import type {
  ActiveFocusTimer,
  ActiveTimer,
  FocusBreakSuggestion,
  FocusIdleDraft,
  FocusSessionRecord,
  SessionConfig,
} from "@/types/focus.types";

import type { FocusSessionStore } from "./focus-session-state.types";

export type FocusSessionPersistence = {
  persistActive: (nextTimer: ActiveTimer | null) => void;
  persistStoredDraft: (config: SessionConfig, idle: FocusIdleDraft) => void;
  clearActiveTimer: () => void;
  appendSession: (record: FocusSessionRecord) => void;
  completeFocusSessionInternal: (currentTimer: ActiveFocusTimer) => void;
  completeBreakSessionInternal: (currentTimer: ActiveTimer) => void;
};

export function useFocusSessionPersistence(
  store: FocusSessionStore,
): FocusSessionPersistence {
  const {
    activeTimerRef,
    setActiveTimer,
    sessionsRef,
    setSessions,
    isAnonymousRef,
    setBreakSuggestion,
    setSystemState,
  } = store;

  const persistActive = useCallback((nextTimer: ActiveTimer | null) => {
    if (!nextTimer) {
      writeFocusActiveTimer(null);
      return;
    }

    writeFocusActiveTimer(withActiveTimerSystemState(nextTimer));
  }, []);

  const persistStoredDraft = useCallback(
    (config: SessionConfig, idle: FocusIdleDraft) => {
      writeFocusDraft({ config, idle });
    },
    [],
  );

  const clearActiveTimer = useCallback(() => {
    activeTimerRef.current = null;
    setActiveTimer(null);
    persistActive(null);
  }, [activeTimerRef, persistActive, setActiveTimer]);

  const appendSession = useCallback(
    (record: FocusSessionRecord) => {
      appendFocusSessionRecord(record);
      setSessions((previous) => {
        const next = [...previous, record];
        sessionsRef.current = next;
        return next;
      });

      if (isAnonymousRef.current) return;
      void clientServices.focus.updateState({ appendSession: record });
    },
    [isAnonymousRef, sessionsRef, setSessions],
  );

  const completeFocusSessionInternal = useCallback(
    (currentTimer: ActiveFocusTimer) => {
      const record = buildFocusSessionRecord(
        currentTimer,
        "completed",
        new Date().toISOString(),
      );
      appendSession(record);

      const suggestion: FocusBreakSuggestion = {
        parentFocusSessionId: record.id,
        parentPlannedFocusSeconds: record.plannedDurationSeconds,
      };

      clearActiveTimer();
      writeFocusBreakSuggestion(suggestion);
      setBreakSuggestion(suggestion);
      setSystemState("break_suggested");
    },
    [appendSession, clearActiveTimer, setBreakSuggestion, setSystemState],
  );

  const completeBreakSessionInternal = useCallback(
    (currentTimer: ActiveTimer) => {
      if (!isActiveBreakTimer(currentTimer)) return;

      const record = buildBreakSessionRecord(
        currentTimer,
        "completed",
        new Date().toISOString(),
      );
      appendSession(record);

      clearActiveTimer();
      writeFocusBreakSuggestion(null);
      setBreakSuggestion(null);
      setSystemState("idle");
    },
    [appendSession, clearActiveTimer, setBreakSuggestion, setSystemState],
  );

  return {
    persistActive,
    persistStoredDraft,
    clearActiveTimer,
    appendSession,
    completeFocusSessionInternal,
    completeBreakSessionInternal,
  };
}
