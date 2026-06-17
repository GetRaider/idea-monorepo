"use client";

import { useEffect } from "react";

import {
  advanceActiveTimer,
  isActiveBreakTimer,
  isActiveFocusTimer,
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

  useEffect(() => {
    if (!isHydrated) return;
    if (systemState !== "running" && systemState !== "break_running") {
      return;
    }

    const interval = window.setInterval(() => {
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

      const nextTimer = advanceActiveTimer(currentTimer);

      if (nextTimer.remainingSeconds === 0) {
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
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    activeTimerRef,
    completeBreakSessionInternal,
    completeFocusSessionInternal,
    isHydrated,
    persistActive,
    setActiveTimer,
    systemState,
    systemStateRef,
  ]);

  useEffect(() => {
    if (!isHydrated) return;

    const persistOnHide = () => {
      if (document.visibilityState !== "hidden") return;
      persistActive(activeTimerRef.current);
    };

    window.addEventListener("beforeunload", persistOnHide);
    document.addEventListener("visibilitychange", persistOnHide);
    return () => {
      window.removeEventListener("beforeunload", persistOnHide);
      document.removeEventListener("visibilitychange", persistOnHide);
    };
  }, [activeTimerRef, isHydrated, persistActive]);
}
