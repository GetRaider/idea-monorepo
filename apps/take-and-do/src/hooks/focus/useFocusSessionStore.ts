"use client";

import { useRef, useState } from "react";

import {
  DEFAULT_IDLE_DRAFT,
  DEFAULT_SESSION_CONFIG,
  randomFocusSessionColor,
} from "@/helpers/focus/focus-session.helper";

import type {
  ActiveTimer,
  FocusBacklogItem,
  FocusBreakSuggestion,
  FocusIdleDraft,
  FocusSessionRecord,
  FocusSystemState,
  SessionConfig,
} from "@/types/focus.types";

import type { FocusSessionStore } from "./focus-session-state.types";

export function useFocusSessionStore(isAnonymous: boolean): FocusSessionStore {
  const isAnonymousRef = useRef(isAnonymous);
  isAnonymousRef.current = isAnonymous;

  const [systemState, setSystemState] = useState<FocusSystemState>("idle");
  const [draft, setDraftState] = useState<SessionConfig>(
    DEFAULT_SESSION_CONFIG,
  );
  const [idleDraft, setIdleDraftState] = useState<FocusIdleDraft>({
    ...DEFAULT_IDLE_DRAFT,
    color: randomFocusSessionColor(),
  });
  const [backlog, setBacklog] = useState<FocusBacklogItem[]>([]);
  const [sessions, setSessions] = useState<FocusSessionRecord[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [breakSuggestion, setBreakSuggestion] =
    useState<FocusBreakSuggestion | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const activeTimerRef = useRef<ActiveTimer | null>(null);
  const systemStateRef = useRef<FocusSystemState>("idle");
  const sessionsRef = useRef<FocusSessionRecord[]>([]);

  activeTimerRef.current = activeTimer;
  systemStateRef.current = systemState;
  sessionsRef.current = sessions;

  return {
    systemState,
    setSystemState,
    draft,
    setDraftState,
    idleDraft,
    setIdleDraftState,
    backlog,
    setBacklog,
    sessions,
    setSessions,
    activeTimer,
    setActiveTimer,
    breakSuggestion,
    setBreakSuggestion,
    isHydrated,
    setIsHydrated,
    activeTimerRef,
    systemStateRef,
    sessionsRef,
    isAnonymousRef,
  };
}
