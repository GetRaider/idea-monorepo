"use client";

import { useCallback } from "react";

import {
  focusConstraint,
  focusRejected,
  focusSuccess,
} from "@/helpers/focus/focus-action-result.helper";
import {
  buildBreakSessionRecord,
  getBreakDurationSeconds,
  isActiveBreakTimer,
} from "@/helpers/focus/focus-session.helper";
import { writeFocusBreakSuggestion } from "@/hooks/focus/focus-storage";

import type { ActiveBreakTimer, FocusActionResult } from "@/types/focus.types";

import type { FocusSessionPersistence } from "./useFocusSessionPersistence";
import type { FocusSessionStore } from "./focus-session-state.types";

export type FocusBreakActions = {
  acceptBreak: () => FocusActionResult;
  skipBreak: () => FocusActionResult;
  stopBreakSession: () => FocusActionResult;
  savePartialBreak: () => FocusActionResult;
  discardBreak: () => FocusActionResult;
};

export function useFocusBreakActions(
  store: FocusSessionStore,
  persistence: FocusSessionPersistence,
): FocusBreakActions {
  const {
    systemStateRef,
    activeTimerRef,
    breakSuggestion,
    setActiveTimer,
    setBreakSuggestion,
    setSystemState,
  } = store;
  const { persistActive, clearActiveTimer, appendSession } = persistence;

  const acceptBreak = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "break_suggested") {
      return focusRejected(
        "accept_break requires system state break_suggested",
      );
    }

    const suggestion = breakSuggestion;
    if (!suggestion) {
      return focusConstraint("no break suggestion available");
    }

    const plannedDurationSeconds = getBreakDurationSeconds(
      suggestion.parentPlannedFocusSeconds,
    );
    const startedAt = new Date().toISOString();
    const nextTimer: ActiveBreakTimer = {
      sessionId: crypto.randomUUID(),
      sessionType: "break",
      systemState: "running",
      parentFocusSessionId: suggestion.parentFocusSessionId,
      plannedDurationSeconds,
      elapsedSeconds: 0,
      remainingSeconds: plannedDurationSeconds,
      pausedAt: null,
      startedAt,
    };

    activeTimerRef.current = nextTimer;
    setActiveTimer(nextTimer);
    persistActive(nextTimer);
    writeFocusBreakSuggestion(null);
    setBreakSuggestion(null);
    setSystemState("break_running");

    return focusSuccess;
  }, [
    activeTimerRef,
    breakSuggestion,
    persistActive,
    setActiveTimer,
    setBreakSuggestion,
    setSystemState,
    systemStateRef,
  ]);

  const skipBreak = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "break_suggested") {
      return focusRejected("skip_break requires system state break_suggested");
    }

    writeFocusBreakSuggestion(null);
    setBreakSuggestion(null);
    setSystemState("idle");

    return focusSuccess;
  }, [setBreakSuggestion, setSystemState, systemStateRef]);

  const stopBreakSession = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "break_running") {
      return focusRejected(
        "stop_break_session requires system state break_running",
      );
    }

    setSystemState("break_stopping");
    return focusSuccess;
  }, [setSystemState, systemStateRef]);

  const savePartialBreak = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "break_stopping") {
      return focusRejected(
        "save_partial_break requires system state break_stopping",
      );
    }

    const currentTimer = activeTimerRef.current;
    if (
      !currentTimer ||
      !isActiveBreakTimer(currentTimer) ||
      currentTimer.elapsedSeconds <= 0
    ) {
      return focusConstraint(
        "save_partial_break requires elapsed break seconds > 0",
      );
    }

    const record = buildBreakSessionRecord(
      currentTimer,
      "interrupted",
      new Date().toISOString(),
    );
    appendSession(record);

    clearActiveTimer();
    setSystemState("idle");

    return focusSuccess;
  }, [
    activeTimerRef,
    appendSession,
    clearActiveTimer,
    setSystemState,
    systemStateRef,
  ]);

  const discardBreak = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "break_stopping") {
      return focusRejected(
        "discard_break requires system state break_stopping",
      );
    }

    clearActiveTimer();
    setSystemState("idle");

    return focusSuccess;
  }, [clearActiveTimer, setSystemState, systemStateRef]);

  return {
    acceptBreak,
    skipBreak,
    stopBreakSession,
    savePartialBreak,
    discardBreak,
  };
}
