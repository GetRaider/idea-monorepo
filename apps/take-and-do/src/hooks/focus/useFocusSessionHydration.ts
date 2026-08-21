"use client";

import { useEffect } from "react";

import {
  DEFAULT_IDLE_DRAFT,
  DEFAULT_SESSION_CONFIG,
  buildDefaultFocusSessionName,
  randomFocusSessionColor,
  systemStateFromActiveTimer,
} from "@/helpers/focus/focus-session.helper";
import {
  readFocusActiveTimer,
  readFocusBreakSuggestion,
  readFocusDraft,
} from "@/hooks/focus/focus-storage";

import type { ActiveTimer, FocusIdleDraft } from "@/types/focus.types";

import type { FocusSessionStore } from "./focus-session-state.types";
import { hydratePersistedFocusState } from "./focus-session-hydration";

export function useFocusSessionHydration(
  store: FocusSessionStore,
  isAnonymous: boolean,
  isSessionPending: boolean,
): void {
  const {
    sessionsRef,
    setSessions,
    setBacklog,
    setDraftState,
    setIdleDraftState,
    setActiveTimer,
    setSystemState,
    setBreakSuggestion,
    setIsHydrated,
  } = store;

  useEffect(() => {
    if (isSessionPending) return;

    let cancelled = false;

    const hydrate = async () => {
      const persisted = await hydratePersistedFocusState(isAnonymous);
      if (cancelled) return;

      const storedDraft = readFocusDraft();
      const storedActive = readFocusActiveTimer();

      setSessions(persisted.sessions);
      sessionsRef.current = persisted.sessions;
      setBacklog(persisted.backlog);

      if (storedDraft) {
        const config = storedDraft.config;
        const defaultName = buildDefaultFocusSessionName(
          persisted.sessions,
          persisted.backlog,
        );
        setDraftState({
          ...config,
          name: config.name.trim() ? config.name : defaultName,
        });
        setIdleDraftState(normalizeHydratedIdleDraft(storedDraft.idle));
      } else {
        setDraftState({
          ...DEFAULT_SESSION_CONFIG,
          name: buildDefaultFocusSessionName(
            persisted.sessions,
            persisted.backlog,
          ),
        });
        setIdleDraftState({
          ...DEFAULT_IDLE_DRAFT,
          color: randomFocusSessionColor(),
        });
      }

      if (storedActive) {
        setActiveTimer(normalizeHydratedActiveTimer(storedActive));
        setSystemState(systemStateFromActiveTimer(storedActive));
      } else {
        const suggestion = readFocusBreakSuggestion();
        if (suggestion) {
          setBreakSuggestion(suggestion);
          setSystemState("break_suggested");
        }
      }

      setIsHydrated(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [
    isAnonymous,
    isSessionPending,
    sessionsRef,
    setActiveTimer,
    setBacklog,
    setBreakSuggestion,
    setDraftState,
    setIdleDraftState,
    setIsHydrated,
    setSessions,
    setSystemState,
  ]);
}

function normalizeHydratedIdleDraft(idle: FocusIdleDraft): FocusIdleDraft {
  return {
    ...idle,
    timerMode: idle.timerMode ?? "stopwatch",
  };
}

function normalizeHydratedActiveTimer(timer: ActiveTimer): ActiveTimer {
  if (timer.sessionType !== "focus") {
    return timer;
  }

  return {
    ...timer,
    timerMode: timer.timerMode ?? "timer",
  };
}
