"use client";

import { useCallback, useEffect } from "react";

import {
  computeActiveTimerFromWallClock,
  isActiveBreakTimer,
  isActiveFocusTimer,
  shouldAutoCompleteActiveTimer,
} from "@/helpers/focus/focus-session.helper";

import type { FocusSessionPersistence } from "./useFocusSessionPersistence";
import type { FocusSessionStore } from "./focus-session-state.types";

export function useFocusActiveTimerEffects(
  store: FocusSessionStore,
  persistence: FocusSessionPersistence,
): void {
  const {
    isHydrated,
    systemState,
    activeTimerRef,
    systemStateRef,
    setActiveTimer,
  } = store;
  const {
    persistActive,
    completeFocusSessionInternal,
    completeBreakSessionInternal,
  } = persistence;

  const syncActiveTimer = useCallback(() => {
    const currentTimer = activeTimerRef.current;
    const currentSystemState = systemStateRef.current;

    if (
      !currentTimer ||
      (currentSystemState !== "running" &&
        currentSystemState !== "break_running")
    ) {
      return;
    }

    if (currentTimer.pausedAt) return;

    const nextTimer = computeActiveTimerFromWallClock(currentTimer);

    if (shouldAutoCompleteActiveTimer(nextTimer)) {
      if (isActiveFocusTimer(nextTimer)) {
        completeFocusSessionInternal({
          ...nextTimer,
          systemState: "running",
        });
      } else if (isActiveBreakTimer(nextTimer)) {
        completeBreakSessionInternal({
          ...nextTimer,
          systemState: "running",
        });
      }
      return;
    }

    activeTimerRef.current = nextTimer;
    setActiveTimer(nextTimer);
    persistActive(nextTimer);
  }, [
    activeTimerRef,
    completeBreakSessionInternal,
    completeFocusSessionInternal,
    persistActive,
    setActiveTimer,
    systemStateRef,
  ]);

  useEffect(() => {
    if (!isHydrated) return;
    if (systemState !== "running" && systemState !== "break_running") {
      return;
    }

    syncActiveTimer();
    const interval = window.setInterval(syncActiveTimer, 1000);

    return () => window.clearInterval(interval);
  }, [isHydrated, syncActiveTimer, systemState]);

  useEffect(() => {
    if (!isHydrated) return;

    const handleVisibilityChange = () => {
      syncActiveTimer();
      if (document.visibilityState === "hidden") {
        persistActive(activeTimerRef.current);
      }
    };

    window.addEventListener("beforeunload", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeTimerRef, isHydrated, persistActive, syncActiveTimer]);
}
