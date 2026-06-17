"use client";

import { useCallback } from "react";

import {
  focusConstraint,
  focusRejected,
  focusSuccess,
} from "@/helpers/focus/focus-action-result.helper";
import { sessionConfigFromBacklogItem } from "@/helpers/focus/focus-session.helper";

import type {
  FocusActionResult,
  FocusIdleDraft,
  SessionConfig,
} from "@/types/focus.types";

import type { FocusSessionPersistence } from "./useFocusSessionPersistence";
import type { FocusSessionStore } from "./focus-session-state.types";

export type FocusDraftActions = {
  setDraft: (nextDraft: SessionConfig) => void;
  configureSession: (partial: Partial<SessionConfig>) => FocusActionResult;
  configureIdleDraft: (partial: Partial<FocusIdleDraft>) => FocusActionResult;
  selectBacklogSession: (backlogId: string) => FocusActionResult;
};

export function useFocusDraftActions(
  store: FocusSessionStore,
  persistence: Pick<FocusSessionPersistence, "persistStoredDraft">,
): FocusDraftActions {
  const { systemStateRef, backlog, setDraftState, setIdleDraftState } = store;
  const { persistStoredDraft } = persistence;

  const setDraft = useCallback(
    (nextDraft: SessionConfig) => {
      setDraftState(nextDraft);
      setIdleDraftState((previousIdle) => {
        persistStoredDraft(nextDraft, previousIdle);
        return previousIdle;
      });
    },
    [persistStoredDraft, setDraftState, setIdleDraftState],
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
    [persistStoredDraft, setDraftState, setIdleDraftState],
  );

  const configureIdleDraft = useCallback(
    (partial: Partial<FocusIdleDraft>): FocusActionResult => {
      if (systemStateRef.current !== "idle") {
        return focusRejected("configure_idle_draft requires system state idle");
      }

      updateStoredDraft(
        (previousConfig) => previousConfig,
        (previousIdle, _nextConfig) => ({ ...previousIdle, ...partial }),
      );

      return focusSuccess;
    },
    [systemStateRef, updateStoredDraft],
  );

  const configureSession = useCallback(
    (partial: Partial<SessionConfig>): FocusActionResult => {
      if (systemStateRef.current !== "idle") {
        return focusRejected("configure_session requires system state idle");
      }

      updateStoredDraft(
        (previousConfig) => ({ ...previousConfig, ...partial }),
        (previousIdle, nextConfig) =>
          nextConfig.taskId
            ? { ...previousIdle, saveToBacklog: false }
            : previousIdle,
      );

      return focusSuccess;
    },
    [systemStateRef, updateStoredDraft],
  );

  const selectBacklogSession = useCallback(
    (backlogId: string): FocusActionResult => {
      if (systemStateRef.current !== "idle") {
        return focusRejected(
          "select_backlog_session requires system state idle",
        );
      }

      const backlogItem = backlog.find((item) => item.id === backlogId);
      if (!backlogItem) {
        return focusConstraint("backlog session not found");
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

      return focusSuccess;
    },
    [
      backlog,
      persistStoredDraft,
      setDraftState,
      setIdleDraftState,
      systemStateRef,
    ],
  );

  return {
    setDraft,
    configureSession,
    configureIdleDraft,
    selectBacklogSession,
  };
}
