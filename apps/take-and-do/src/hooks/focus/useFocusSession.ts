"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_IDLE_DRAFT,
  DEFAULT_SESSION_CONFIG,
  backlogItemFromConfig,
  buildActiveSession,
  buildBreakSessionRecord,
  buildDefaultFocusSessionName,
  buildFocusSessionRecord,
  canEnableSaveToBacklog,
  getBreakDurationSeconds,
  getDailyFocusSeconds,
  getPlannedFocusDurationSeconds,
  getWeeklyFocusSeconds,
  isActiveTimerSystemState,
  randomFocusSessionColor,
  runtimeFromActiveSession,
  sessionConfigFromBacklogItem,
  systemStateFromActiveSession,
  validateSessionConfig,
} from "@/helpers/focus/focus-session.helper";
import {
  appendFocusBacklogItem,
  appendFocusSessionRecord,
  readFocusActiveSession,
  readFocusBacklogStore,
  readFocusBreakSuggestion,
  readFocusDraft,
  readFocusSessionsStore,
  writeFocusActiveSession,
  writeFocusBreakSuggestion,
  writeFocusDraft,
} from "@/hooks/focus/focus-storage";

import type {
  ActiveSession,
  FocusActionResult,
  FocusBacklogItem,
  FocusBreakSuggestion,
  FocusIdleDraft,
  FocusRuntime,
  FocusSessionRecord,
  FocusSystemState,
  SessionConfig,
  StoredFocusDraft,
} from "@/types/focus.types";

export function useFocusSession() {
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
  const [runtime, setRuntime] = useState<FocusRuntime | null>(null);
  const [breakSuggestion, setBreakSuggestion] =
    useState<FocusBreakSuggestion | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const runtimeRef = useRef<FocusRuntime | null>(null);
  const systemStateRef = useRef<FocusSystemState>("idle");
  const sessionsRef = useRef<FocusSessionRecord[]>([]);

  runtimeRef.current = runtime;
  systemStateRef.current = systemState;
  sessionsRef.current = sessions;

  const persistActive = useCallback((nextRuntime: FocusRuntime | null) => {
    if (!nextRuntime) {
      writeFocusActiveSession(null);
      return;
    }

    const timerState: ActiveSession["systemState"] = nextRuntime.pausedAt
      ? "paused"
      : "running";

    writeFocusActiveSession(buildActiveSession(nextRuntime, timerState));
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
  }, []);

  const completeFocusSessionInternal = useCallback(
    (currentRuntime: FocusRuntime) => {
      const endedAt = new Date().toISOString();
      const record = buildFocusSessionRecord(
        currentRuntime,
        "completed",
        endedAt,
      );
      appendFocusSessionRecord(record);

      const nextSessions = [...sessionsRef.current, record];
      sessionsRef.current = nextSessions;
      setSessions(nextSessions);

      const suggestion: FocusBreakSuggestion = {
        parentFocusSessionId: record.id,
        parentPlannedFocusSeconds: record.plannedDurationSeconds,
      };

      runtimeRef.current = null;
      setRuntime(null);
      persistActive(null);
      writeFocusBreakSuggestion(suggestion);
      setBreakSuggestion(suggestion);
      setSystemState("break_suggested");
    },
    [persistActive],
  );

  const completeBreakSessionInternal = useCallback(
    (currentRuntime: FocusRuntime) => {
      const parentFocusSessionId = currentRuntime.parentFocusSessionId;
      if (!parentFocusSessionId) return;

      const endedAt = new Date().toISOString();
      const record = buildBreakSessionRecord(
        currentRuntime,
        parentFocusSessionId,
        "completed",
        endedAt,
      );
      appendFocusSessionRecord(record);

      const nextSessions = [...sessionsRef.current, record];
      sessionsRef.current = nextSessions;
      setSessions(nextSessions);

      runtimeRef.current = null;
      setRuntime(null);
      persistActive(null);
      writeFocusBreakSuggestion(null);
      setBreakSuggestion(null);
      setSystemState("idle");
    },
    [persistActive],
  );

  useEffect(() => {
    const storedSessions = readFocusSessionsStore();
    const storedBacklog = readFocusBacklogStore();
    const storedDraft = readFocusDraft();
    const storedActive = readFocusActiveSession();

    setSessions(storedSessions.items);
    sessionsRef.current = storedSessions.items;
    setBacklog(storedBacklog.items);

    if (storedDraft) {
      const config = storedDraft.config;
      const defaultName = buildDefaultFocusSessionName(
        storedSessions.items,
        storedBacklog.items,
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
          storedSessions.items,
          storedBacklog.items,
        ),
      });
      setIdleDraftState({
        ...DEFAULT_IDLE_DRAFT,
        color: randomFocusSessionColor(),
      });
    }

    if (storedActive) {
      const restoredRuntime = runtimeFromActiveSession(
        storedActive,
        storedSessions.items,
      );
      setRuntime(restoredRuntime);
      setSystemState(systemStateFromActiveSession(storedActive));
    } else {
      const suggestion = readFocusBreakSuggestion();
      if (suggestion) {
        setBreakSuggestion(suggestion);
        setSystemState("break_suggested");
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (systemState !== "running" && systemState !== "break_running") {
      return;
    }

    const interval = window.setInterval(() => {
      const currentRuntime = runtimeRef.current;
      const currentSystemState = systemStateRef.current;

      if (
        !currentRuntime ||
        (currentSystemState !== "running" &&
          currentSystemState !== "break_running")
      ) {
        return;
      }

      if (currentRuntime.pausedAt) return;

      const nextElapsed = currentRuntime.elapsedSeconds + 1;
      const nextRemaining = Math.max(
        0,
        currentRuntime.plannedDurationSeconds - nextElapsed,
      );
      const nextRuntime: FocusRuntime = {
        ...currentRuntime,
        elapsedSeconds: nextElapsed,
        remainingSeconds: nextRemaining,
      };

      if (nextRemaining === 0) {
        if (currentSystemState === "running") {
          completeFocusSessionInternal(nextRuntime);
        } else {
          completeBreakSessionInternal(nextRuntime);
        }
        return;
      }

      runtimeRef.current = nextRuntime;
      setRuntime(nextRuntime);
      persistActive(nextRuntime);
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
      persistActive(runtimeRef.current);
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
      }

      const plannedDurationSeconds = getPlannedFocusDurationSeconds(config);
      const startedAt = new Date().toISOString();
      const nextRuntime: FocusRuntime = {
        sessionId: crypto.randomUUID(),
        sessionType: "focus",
        config: { ...config, name: config.name.trim() },
        plannedDurationSeconds,
        elapsedSeconds: 0,
        remainingSeconds: plannedDurationSeconds,
        pausedAt: null,
        startedAt,
        parentFocusSessionId: null,
      };

      const nextBacklog = savedBacklogItem
        ? [...backlog, savedBacklogItem]
        : backlog;
      const nextDefaultName = buildDefaultFocusSessionName(
        sessionsRef.current,
        nextBacklog,
      );

      runtimeRef.current = nextRuntime;
      setRuntime(nextRuntime);
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
      persistActive(nextRuntime);
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

    const currentRuntime = runtimeRef.current;
    if (!currentRuntime) {
      return { status: "CONSTRAINT_VIOLATION", reason: "no active runtime" };
    }

    const nextRuntime: FocusRuntime = {
      ...currentRuntime,
      pausedAt: new Date().toISOString(),
    };

    runtimeRef.current = nextRuntime;
    setRuntime(nextRuntime);
    persistActive(nextRuntime);
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

    const currentRuntime = runtimeRef.current;
    if (!currentRuntime) {
      return { status: "CONSTRAINT_VIOLATION", reason: "no active runtime" };
    }

    const nextRuntime: FocusRuntime = {
      ...currentRuntime,
      pausedAt: null,
    };

    runtimeRef.current = nextRuntime;
    setRuntime(nextRuntime);
    persistActive(nextRuntime);
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

    const currentRuntime = runtimeRef.current;
    if (!currentRuntime || currentRuntime.elapsedSeconds <= 0) {
      return {
        status: "CONSTRAINT_VIOLATION",
        reason: "save_partial_session requires elapsed focus seconds > 0",
      };
    }

    const endedAt = new Date().toISOString();
    const record = buildFocusSessionRecord(
      currentRuntime,
      "interrupted",
      endedAt,
    );
    appendSession(record);

    runtimeRef.current = null;
    setRuntime(null);
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

    runtimeRef.current = null;
    setRuntime(null);
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

    const parentSession = sessionsRef.current.find(
      (session) => session.id === suggestion.parentFocusSessionId,
    );
    if (!parentSession || parentSession.type !== "focus") {
      return {
        status: "CONSTRAINT_VIOLATION",
        reason: "parent focus session not found",
      };
    }

    const plannedDurationSeconds = getBreakDurationSeconds(
      suggestion.parentPlannedFocusSeconds,
    );
    const startedAt = new Date().toISOString();
    const nextRuntime: FocusRuntime = {
      sessionId: crypto.randomUUID(),
      sessionType: "break",
      config: {
        mode: parentSession.mode,
        presetId: parentSession.presetId,
        durationMinutes:
          parentSession.mode === "custom"
            ? Math.round(parentSession.plannedDurationSeconds / 60)
            : null,
        taskId: parentSession.taskId,
        name: parentSession.name,
      },
      plannedDurationSeconds,
      elapsedSeconds: 0,
      remainingSeconds: plannedDurationSeconds,
      pausedAt: null,
      startedAt,
      parentFocusSessionId: suggestion.parentFocusSessionId,
    };

    runtimeRef.current = nextRuntime;
    setRuntime(nextRuntime);
    persistActive(nextRuntime);
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

    const currentRuntime = runtimeRef.current;
    const parentFocusSessionId = currentRuntime?.parentFocusSessionId;
    if (
      !currentRuntime ||
      !parentFocusSessionId ||
      currentRuntime.elapsedSeconds <= 0
    ) {
      return {
        status: "CONSTRAINT_VIOLATION",
        reason: "save_partial_break requires elapsed break seconds > 0",
      };
    }

    const endedAt = new Date().toISOString();
    const record = buildBreakSessionRecord(
      currentRuntime,
      parentFocusSessionId,
      "interrupted",
      endedAt,
    );
    appendSession(record);

    runtimeRef.current = null;
    setRuntime(null);
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

    runtimeRef.current = null;
    setRuntime(null);
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

  const canSaveOnStop = (runtime?.elapsedSeconds ?? 0) > 0;
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
    runtime,
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
