"use client";

import { useCallback } from "react";

import {
  focusConstraint,
  focusRejected,
  focusSuccess,
} from "@/helpers/focus/focus-action-result.helper";
import {
  DEFAULT_IDLE_DRAFT,
  DEFAULT_SESSION_CONFIG,
  backlogItemFromConfig,
  buildDefaultFocusSessionName,
  buildFocusSessionRecord,
  canEnableSaveToBacklog,
  getPlannedFocusDurationSeconds,
  isActiveFocusTimer,
  randomFocusSessionColor,
  sessionConfigFromBacklogItem,
  validateSessionConfig,
} from "@/helpers/focus/focus-session.helper";
import { clientServices } from "@/services";
import { appendFocusBacklogItem } from "@/hooks/focus/focus-storage";

import type {
  ActiveFocusTimer,
  FocusActionResult,
  FocusBacklogItem,
  FocusIdleDraft,
  SessionConfig,
} from "@/types/focus.types";

import type { FocusSessionPersistence } from "./useFocusSessionPersistence";
import type { FocusSessionStore } from "./focus-session-state.types";

export type FocusSessionLifecycleActions = {
  startFocusSession: (payload?: SessionConfig) => FocusActionResult;
  pauseFocusSession: () => FocusActionResult;
  resumeFocusSession: () => FocusActionResult;
  stopFocusSession: () => FocusActionResult;
  savePartialSession: () => FocusActionResult;
  discardSession: () => FocusActionResult;
};

export function useFocusSessionLifecycleActions(
  store: FocusSessionStore,
  persistence: FocusSessionPersistence,
): FocusSessionLifecycleActions {
  const {
    systemStateRef,
    activeTimerRef,
    sessionsRef,
    isAnonymousRef,
    draft,
    idleDraft,
    backlog,
    setActiveTimer,
    setDraftState,
    setIdleDraftState,
    setBacklog,
    setSystemState,
  } = store;
  const { persistActive, persistStoredDraft, clearActiveTimer, appendSession } =
    persistence;

  const startFocusSession = useCallback(
    (payload?: SessionConfig): FocusActionResult => {
      if (systemStateRef.current !== "idle") {
        return focusRejected("start_focus_session requires system state idle");
      }

      let config = payload ?? draft;

      if (idleDraft.sessionSelection === "backlog") {
        if (!idleDraft.selectedBacklogId) {
          return focusConstraint("select a backlog session");
        }
        const backlogItem = backlog.find(
          (item) => item.id === idleDraft.selectedBacklogId,
        );
        if (!backlogItem) {
          return focusConstraint("backlog session not found");
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

      return focusSuccess;
    },
    [
      activeTimerRef,
      backlog,
      draft,
      idleDraft,
      isAnonymousRef,
      persistActive,
      persistStoredDraft,
      sessionsRef,
      setActiveTimer,
      setBacklog,
      setDraftState,
      setIdleDraftState,
      setSystemState,
      systemStateRef,
    ],
  );

  const pauseFocusSession = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "running") {
      return focusRejected("pause_focus_session requires system state running");
    }

    const currentTimer = activeTimerRef.current;
    if (!currentTimer || !isActiveFocusTimer(currentTimer)) {
      return focusConstraint("no active focus timer");
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

    return focusSuccess;
  }, [
    activeTimerRef,
    persistActive,
    setActiveTimer,
    setSystemState,
    systemStateRef,
  ]);

  const resumeFocusSession = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "paused") {
      return focusRejected("resume_focus_session requires system state paused");
    }

    const currentTimer = activeTimerRef.current;
    if (!currentTimer || !isActiveFocusTimer(currentTimer)) {
      return focusConstraint("no active focus timer");
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

    return focusSuccess;
  }, [
    activeTimerRef,
    persistActive,
    setActiveTimer,
    setSystemState,
    systemStateRef,
  ]);

  const stopFocusSession = useCallback((): FocusActionResult => {
    const currentSystemState = systemStateRef.current;
    if (currentSystemState !== "running" && currentSystemState !== "paused") {
      return focusRejected(
        "stop_focus_session requires system state running or paused",
      );
    }

    setSystemState("stopping");
    return focusSuccess;
  }, [setSystemState, systemStateRef]);

  const savePartialSession = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "stopping") {
      return focusRejected(
        "save_partial_session requires system state stopping",
      );
    }

    const currentTimer = activeTimerRef.current;
    if (
      !currentTimer ||
      !isActiveFocusTimer(currentTimer) ||
      currentTimer.elapsedSeconds <= 0
    ) {
      return focusConstraint(
        "save_partial_session requires elapsed focus seconds > 0",
      );
    }

    const record = buildFocusSessionRecord(
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

  const discardSession = useCallback((): FocusActionResult => {
    if (systemStateRef.current !== "stopping") {
      return focusRejected("discard_session requires system state stopping");
    }

    clearActiveTimer();
    setSystemState("idle");

    return focusSuccess;
  }, [clearActiveTimer, setSystemState, systemStateRef]);

  return {
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    stopFocusSession,
    savePartialSession,
    discardSession,
  };
}
