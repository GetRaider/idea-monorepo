"use client";

import { useMemo } from "react";

import { authClient } from "@/auth/client";
import {
  getDailyFocusSeconds,
  getWeeklyFocusSeconds,
  isActiveTimerSystemState,
} from "@/helpers/focus/focus-session.helper";

import { useFocusActiveTimerEffects } from "./useFocusActiveTimerEffects";
import { useFocusBreakActions } from "./useFocusBreakActions";
import { useFocusDraftActions } from "./useFocusDraftActions";
import { useFocusSessionHydration } from "./useFocusSessionHydration";
import { useFocusSessionLifecycleActions } from "./useFocusSessionLifecycleActions";
import { useFocusSessionPersistence } from "./useFocusSessionPersistence";
import { useFocusSessionStore } from "./useFocusSessionStore";

type UserWithAnonymous = {
  isAnonymous?: boolean;
};

export function useFocusSession() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const isAnonymous =
    (session?.user as UserWithAnonymous | undefined)?.isAnonymous ?? false;

  const store = useFocusSessionStore(isAnonymous);
  const {
    systemState,
    draft,
    idleDraft,
    backlog,
    sessions,
    activeTimer,
    breakSuggestion,
    isHydrated,
  } = store;

  const persistence = useFocusSessionPersistence(store);
  useFocusSessionHydration(store, isAnonymous, isSessionPending);
  useFocusActiveTimerEffects(store, persistence);

  const draftActions = useFocusDraftActions(store, persistence);
  const sessionActions = useFocusSessionLifecycleActions(store, persistence);
  const breakActions = useFocusBreakActions(store, persistence);

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
    ...draftActions,
    ...sessionActions,
    ...breakActions,
  };
}

export type FocusSessionContextValue = ReturnType<typeof useFocusSession>;
