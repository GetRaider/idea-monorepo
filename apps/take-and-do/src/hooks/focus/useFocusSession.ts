"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { authClient } from "@/auth/client";
import { clientServices } from "@/services";
import {
  DEFAULT_IDLE_DRAFT,
  DEFAULT_SESSION_CONFIG,
  backlogItemFromConfig,
  buildBreakSessionRecord,
  buildDefaultFocusSessionName,
  buildFocusSessionRecord,
  canEnableSaveToBacklog,
  getBreakDurationSeconds,
  getDailyFocusSeconds,
  getPlannedFocusDurationSeconds,
  getWeeklyFocusSeconds,
  isActiveBreakTimer,
  isActiveFocusTimer,
  isActiveTimerSystemState,
  randomFocusSessionColor,
  sessionConfigFromBacklogItem,
  systemStateFromActiveTimer,
  validateSessionConfig,
  withActiveTimerSystemState,
} from "@/helpers/focus/focus-session.helper";
import {
  appendFocusBacklogItem,
  appendFocusSessionRecord,
  readFocusActiveTimer,
  readFocusBreakSuggestion,
  readFocusDraft,
  writeFocusActiveTimer,
  writeFocusBacklogStore,
  writeFocusBreakSuggestion,
  writeFocusDraft,
  writeFocusSessionsStore,
} from "@/hooks/focus/focus-storage";

import type {
  ActiveBreakTimer,
  ActiveFocusTimer,
  ActiveTimer,
  FocusActionResult,
  FocusBacklogItem,
  FocusBreakSuggestion,
  FocusIdleDraft,
  FocusSessionRecord,
  FocusSystemState,
  SessionConfig,
  StoredFocusDraft,
} from "@/types/focus.types";

type UserWithAnonymous = {
  isAnonymous?: boolean;
};

export function useFocusSession() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const isAnonymous =
    (session?.user as UserWithAnonymous | undefined)?.isAnonymous ?? false;
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

  const persistActive = useCallback((nextTimer: ActiveTimer | null) => {
    if (!nextTimer) {
      writeFocusActiveTimer(null);
      return;
    }

    writeFocusActiveTimer(withActiveTimerSystemState(nextTimer));
  }, []);

  const persistDraft = useCallback((stored: StoredFocusDraft) => {
    writeFocusDraft(stored);
  }, []);

  const persistStoredDraft = useCallback(
    (config: SessionConfig, idle: FocusIdleDraft) => {
      persistDraft({ config, idle });
    },
    [persistDraft],
  );

  const appendSession = useCallback((record: FocusSessionRecord) => {
    appendFocusSessionRecord(record);
    setSessions((previous) => {
      const next = [...previous, record];
      sessionsRef.current = next;
      return next;
    });

    if (isAnonymousRef.current) return;
    void clientServices.focus.updateState({ appendSession: record });
  }, []);

  const completeFocusSessionInternal = useCallback(
    (currentTimer: ActiveFocusTimer) => {
      const endedAt = new Date().toISOString();
      const record = buildFocusSessionRecord(
        currentTimer,
        "completed",
        endedAt,
      );
      appendFocusSessionRecord(record);

      const nextSessions = [...sessionsRef.current, record];
      sessionsRef.current = nextSessions;
      setSessions(nextSessions);

      if (!isAnonymousRef.current) {
        void clientServices.focus.updateState({ appendSession: record });
      }

      const suggestion: FocusBreakSuggestion = {
        parentFocusSessionId: record.id,
        parentPlannedFocusSeconds: record.plannedDurationSeconds,
      };

      activeTimerRef.current = null;
      setActiveTimer(null);
      persistActive(null);
      writeFocusBreakSuggestion(suggestion);
      setBreakSuggestion(suggestion);
      setSystemState("break_suggested");
    },
    [persistActive],
  );

  const completeBreakSessionInternal = useCallback(
    (currentTimer: ActiveTimer) => {
      if (!isActiveBreakTimer(currentTimer)) return;

      const endedAt = new Date().toISOString();
      const record = buildBreakSessionRecord(
        currentTimer,
        "completed",
        endedAt,
      );
      appendFocusSessionRecord(record);

      const nextSessions = [...sessionsRef.current, record];
      sessionsRef.current = nextSessions;
      setSessions(nextSessions);

      if (!isAnonymousRef.current) {
        void clientServices.focus.updateState({ appendSession: record });
      }

      activeTimerRef.current = null;
      setActiveTimer(null);
      persistActive(null);
      writeFocusBreakSuggestion(null);
      setBreakSuggestion(null);
      setSystemState("idle");
    },
    [persistActive],
  );

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
        setIdleDraftState(storedDraft.idle);
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
        setActiveTimer(storedActive);
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
  }, [isAnonymous, isSessionPending]);

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

      const nextElapsed = currentTimer.elapsedSeconds + 1;
      const nextRemaining = Math.max(
        0,
        currentTimer.plannedDurationSeconds - nextElapsed,
      );
      const nextTimer: ActiveTimer = {
        ...currentTimer,
        elapsedSeconds: nextElapsed,
        remainingSeconds: nextRemaining,
      };

      if (nextRemaining === 0) {
        if (isActiveFocusTimer(currentTimer)) {
          completeFocusSessionInternal({
            ...currentTimer,
            elapsedSeconds: nextElapsed,
            remainingSeconds: nextRemaining,
            systemState: "running",
          });
        } else if (isActiveBreakTimer(currentTimer)) {
          completeBreakSessionInternal({
            ...currentTimer,
            elapsedSeconds: nextElapsed,
            remainingSeconds: nextRemaining,
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
    completeBreakSessionInternal,
    completeFocusSessionInternal,
    isHydrated,
    persistActive,
    systemState,
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
  }, [isHydrated, persistActive]);

  const setDraft = useCallback(
    (nextDraft: SessionConfig) => {
      setDraftState(nextDraft);
      setIdleDraftState((previousIdle) => {
        persistStoredDraft(nextDraft, previousIdle);
        return previousIdle;
      });
    },
    [persistStoredDraft],
  );

  const updateStoredDraft = useCallback(
    (
      configUpdater: (previous: SessionConfig) => SessionConfig,
      idleUpdater: (
        previous: FocusIdleDraft,
        nextConfig: SessionConfig,
      ) => FocusIdleDraft,
    ) => {
      setDraftState((previousConfig) => {
        const nextConfig = configUpdater(previousConfig);
        setIdleDraftState((previousIdle) => {
          const nextIdle = idleUpdater(previousIdle, nextConfig);
          persistStoredDraft(nextConfig, nextIdle);
          return nextIdle;
        });
        return nextConfig;
      });
    },
    [persistStoredDraft],
  );

  const configureIdleDraft = useCallback(
    (partial: Partial<FocusIdleDraft>): FocusActionResult => {
      if (systemStateRef.current !== "idle") {
        return {
          status: "REJECTED",
          reason: "configure_idle_draft requires system state idle",
        };
      }

      updateStoredDraft(
        (previousConfig) => previousConfig,
        (previousIdle, _nextConfig) => ({ ...previousIdle, ...partial }),
      );

      return { status: "SUCCESS" };
    },
    [updateStoredDraft],
  );

  const configureSession = useCallback(
    (partial: Partial<SessionConfig>): FocusActionResult => {
      if (systemStateRef.current !== "idle") {
        return {
          status: "REJECTED",
          reason: "configure_session requires system state idle",
        };
      }

      updateStoredDraft(
        (previousConfig) => ({ ...previousConfig, ...partial }),
        (previousIdle, nextConfig) =>
          nextConfig.taskId
            ? { ...previousIdle, saveToBacklog: false }
            : previousIdle,
      );

      return { status: "SUCCESS" };
    },
    [updateStoredDraft],
  );

  const startFocusSession = useCallback(
    (payload?: SessionConfig): FocusActionResult => {
      if (systemStateRef.current !== "idle") {
        return {
          status: "REJECTED",
          reason: "start_focus_session requires system state idle",
        };
      }

      let config = payload ?? draft;

      if (idleDraft.sessionSelection === "backlog") {
        if (!idleDraft.selectedBacklogId) {
          return {
            status: "CONSTRAINT_VIOLATION",
            reason: "select a backlog session",
          };
        }
        const backlogItem = backlog.find(
          (item) => item.id === idleDraft.selectedBacklogId,
        );
        if (!backlogItem) {
          return {
            status: "CONSTRAINT_VIOLATION",
            reason: "backlog session not found",
          };
        }
        config = sessionConfigFromBacklogItem(backlogItem);
      }

      const validation = validateSessionConfig(config);
      if (validation.status !== "SUCCESS") {
        return validation;
      }

      let savedBacklogItem: FocusBacklogItem | null = null;
      if (
        idleDraft.sessionSelection === "new" &&
        idleDraft.saveToBacklog &&
        canEnableSaveToBacklog(config, idleDraft)
      ) {
        savedBacklogItem = backlogItemFromConfig(config, idleDraft.color);
        appendFocusBacklogItem(savedBacklogItem);
        setBacklog((previous) => [...previous, savedBacklogItem!]);

        if (!isAnonymousRef.current) {
          void clientServices.focus.updateState({
            appendBacklogItem: savedBacklogItem,
          });
        }
      }

      const sessionColor =
        idleDraft.sessionSelection === "backlog" && idleDraft.selectedBacklogId
          ? (backlog.find((item) => item.id === idleDraft.selectedBacklogId)
              ?.color ?? idleDraft.color)
          : idleDraft.color;

      const plannedDurationSeconds = getPlannedFocusDurationSeconds(config);
      const startedAt = new Date().toISOString();
      const nextTimer: ActiveFocusTimer = {
        sessionId: crypto.randomUUID(),
        sessionType: "focus",
        systemState: "running",
        name: config.name.trim(),
        taskId: config.taskId,
        color: sessionColor,
        plannedDurationSeconds,
        elapsedSeconds: 0,
        remainingSeconds: plannedDurationSeconds,
        pausedAt: null,
        startedAt,
      };

      const nextBacklog = savedBacklogItem
        ? [...backlog, savedBacklogItem]
        : backlog;
      const nextDefaultName = buildDefaultFocusSessionName(
        sessionsRef.current,
        nextBacklog,
      );

      activeTimerRef.current = nextTimer;
      setActiveTimer(nextTimer);
      const nextDraftConfig = {
        ...DEFAULT_SESSION_CONFIG,
        name: nextDefaultName,
      };
      const nextIdleDraft: FocusIdleDraft = {
        ...DEFAULT_IDLE_DRAFT,
        color: randomFocusSessionColor(),
      };
      setDraftState(nextDraftConfig);
      setIdleDraftState(nextIdleDraft);
      persistStoredDraft(nextDraftConfig, nextIdleDraft);
      persistActive(nextTimer);
      setSystemState("running");

      return { status: "SUCCESS" };
    },
    [backlog, draft, idleDraft, persistActive, persistStoredDraft],
  );

  const pauseFocusSession = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "running") {
      return {
        status: "REJECTED",
        reason: "pause_focus_session requires system state running",
      };
    }

    const currentTimer = activeTimerRef.current;
    if (!currentTimer || !isActiveFocusTimer(currentTimer)) {
      return {
        status: "CONSTRAINT_VIOLATION",
        reason: "no active focus timer",
      };
    }

    const nextTimer: ActiveFocusTimer = {
      ...currentTimer,
      systemState: "paused",
      pausedAt: new Date().toISOString(),
    };

    activeTimerRef.current = nextTimer;
    setActiveTimer(nextTimer);
    persistActive(nextTimer);
    setSystemState("paused");

    return { status: "SUCCESS" };
  }, [persistActive]);

  const resumeFocusSession = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "paused") {
      return {
        status: "REJECTED",
        reason: "resume_focus_session requires system state paused",
      };
    }

    const currentTimer = activeTimerRef.current;
    if (!currentTimer || !isActiveFocusTimer(currentTimer)) {
      return {
        status: "CONSTRAINT_VIOLATION",
        reason: "no active focus timer",
      };
    }

    const nextTimer: ActiveFocusTimer = {
      ...currentTimer,
      systemState: "running",
      pausedAt: null,
    };

    activeTimerRef.current = nextTimer;
    setActiveTimer(nextTimer);
    persistActive(nextTimer);
    setSystemState("running");

    return { status: "SUCCESS" };
  }, [persistActive]);

  const stopFocusSession = useCallback((): FocusActionResult => {
    const currentSystemState = systemStateRef.current;
    if (currentSystemState !== "running" && currentSystemState !== "paused") {
      return {
        status: "REJECTED",
        reason: "stop_focus_session requires system state running or paused",
      };
    }

    setSystemState("stopping");
    return { status: "SUCCESS" };
  }, []);

  const savePartialSession = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "stopping") {
      return {
        status: "REJECTED",
        reason: "save_partial_session requires system state stopping",
      };
    }

    const currentTimer = activeTimerRef.current;
    if (
      !currentTimer ||
      !isActiveFocusTimer(currentTimer) ||
      currentTimer.elapsedSeconds <= 0
    ) {
      return {
        status: "CONSTRAINT_VIOLATION",
        reason: "save_partial_session requires elapsed focus seconds > 0",
      };
    }

    const endedAt = new Date().toISOString();
    const record = buildFocusSessionRecord(
      currentTimer,
      "interrupted",
      endedAt,
    );
    appendSession(record);

    activeTimerRef.current = null;
    setActiveTimer(null);
    persistActive(null);
    setSystemState("idle");

    return { status: "SUCCESS" };
  }, [appendSession, persistActive]);

  const discardSession = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "stopping") {
      return {
        status: "REJECTED",
        reason: "discard_session requires system state stopping",
      };
    }

    activeTimerRef.current = null;
    setActiveTimer(null);
    persistActive(null);
    setSystemState("idle");

    return { status: "SUCCESS" };
  }, [persistActive]);

  const acceptBreak = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "break_suggested") {
      return {
        status: "REJECTED",
        reason: "accept_break requires system state break_suggested",
      };
    }

    const suggestion = breakSuggestion;
    if (!suggestion) {
      return {
        status: "CONSTRAINT_VIOLATION",
        reason: "no break suggestion available",
      };
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

    return { status: "SUCCESS" };
  }, [breakSuggestion, persistActive]);

  const skipBreak = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "break_suggested") {
      return {
        status: "REJECTED",
        reason: "skip_break requires system state break_suggested",
      };
    }

    writeFocusBreakSuggestion(null);
    setBreakSuggestion(null);
    setSystemState("idle");

    return { status: "SUCCESS" };
  }, []);

  const stopBreakSession = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "break_running") {
      return {
        status: "REJECTED",
        reason: "stop_break_session requires system state break_running",
      };
    }

    setSystemState("break_stopping");
    return { status: "SUCCESS" };
  }, []);

  const savePartialBreak = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "break_stopping") {
      return {
        status: "REJECTED",
        reason: "save_partial_break requires system state break_stopping",
      };
    }

    const currentTimer = activeTimerRef.current;
    if (
      !currentTimer ||
      !isActiveBreakTimer(currentTimer) ||
      currentTimer.elapsedSeconds <= 0
    ) {
      return {
        status: "CONSTRAINT_VIOLATION",
        reason: "save_partial_break requires elapsed break seconds > 0",
      };
    }

    const endedAt = new Date().toISOString();
    const record = buildBreakSessionRecord(
      currentTimer,
      "interrupted",
      endedAt,
    );
    appendSession(record);

    activeTimerRef.current = null;
    setActiveTimer(null);
    persistActive(null);
    setSystemState("idle");

    return { status: "SUCCESS" };
  }, [appendSession, persistActive]);

  const discardBreak = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "break_stopping") {
      return {
        status: "REJECTED",
        reason: "discard_break requires system state break_stopping",
      };
    }

    activeTimerRef.current = null;
    setActiveTimer(null);
    persistActive(null);
    setSystemState("idle");

    return { status: "SUCCESS" };
  }, [persistActive]);

  const dailyFocusSeconds = useMemo(
    () => getDailyFocusSeconds(sessions),
    [sessions],
  );

  const weeklyFocusSeconds = useMemo(
    () => getWeeklyFocusSeconds(sessions),
    [sessions],
  );

  const canSaveOnStop = (activeTimer?.elapsedSeconds ?? 0) > 0;
  const isTimerActive = isActiveTimerSystemState(systemState);

  const selectBacklogSession = useCallback(
    (backlogId: string): FocusActionResult => {
      if (systemStateRef.current !== "idle") {
        return {
          status: "REJECTED",
          reason: "select_backlog_session requires system state idle",
        };
      }

      const backlogItem = backlog.find((item) => item.id === backlogId);
      if (!backlogItem) {
        return {
          status: "CONSTRAINT_VIOLATION",
          reason: "backlog session not found",
        };
      }

      const config = sessionConfigFromBacklogItem(backlogItem);
      setDraftState(config);
      setIdleDraftState((previousIdle) => {
        const nextIdle: FocusIdleDraft = {
          ...previousIdle,
          sessionSelection: "backlog",
          selectedBacklogId: backlogId,
          color: backlogItem.color,
        };
        persistStoredDraft(config, nextIdle);
        return nextIdle;
      });

      return { status: "SUCCESS" };
    },
    [backlog, persistStoredDraft],
  );

  return {
    isHydrated,
    systemState,
    draft,
    idleDraft,
    backlog,
    sessions,
    activeTimer,
    breakSuggestion,
    canSaveOnStop,
    isTimerActive,
    dailyFocusSeconds,
    weeklyFocusSeconds,
    setDraft,
    configureSession,
    configureIdleDraft,
    selectBacklogSession,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    stopFocusSession,
    savePartialSession,
    discardSession,
    acceptBreak,
    skipBreak,
    stopBreakSession,
    savePartialBreak,
    discardBreak,
  };
}

export type FocusSessionContextValue = ReturnType<typeof useFocusSession>;

async function hydratePersistedFocusState(
  isAnonymous: boolean,
): Promise<{ sessions: FocusSessionRecord[]; backlog: FocusBacklogItem[] }> {
  if (isAnonymous) {
    resetLocalFocusPersistence();
    return { sessions: [], backlog: [] };
  }

  resetLocalFocusPersistence();

  const remote = await clientServices.focus.getState();

  if (!remote) {
    writeFocusSessionsStore({ version: 2, items: [] });
    writeFocusBacklogStore({ version: 2, items: [] });
    return { sessions: [], backlog: [] };
  }

  writeFocusSessionsStore({ version: 2, items: remote.sessions });
  writeFocusBacklogStore({ version: 2, items: remote.backlog });
  return remote;
}

function resetLocalFocusPersistence(): void {
  writeFocusSessionsStore({ version: 2, items: [] });
  writeFocusBacklogStore({ version: 2, items: [] });
  writeFocusActiveTimer(null);
  writeFocusDraft(null);
  writeFocusBreakSuggestion(null);
}
