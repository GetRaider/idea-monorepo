import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type {
  ActiveTimer,
  FocusBacklogItem,
  FocusBreakSuggestion,
  FocusIdleDraft,
  FocusSessionRecord,
  FocusSystemState,
  SessionConfig,
} from "@/types/focus.types";

export type FocusSessionStateRefs = {
  activeTimerRef: MutableRefObject<ActiveTimer | null>;
  systemStateRef: MutableRefObject<FocusSystemState>;
  sessionsRef: MutableRefObject<FocusSessionRecord[]>;
  isAnonymousRef: MutableRefObject<boolean>;
};

export type FocusSessionState = {
  systemState: FocusSystemState;
  setSystemState: Dispatch<SetStateAction<FocusSystemState>>;
  draft: SessionConfig;
  setDraftState: Dispatch<SetStateAction<SessionConfig>>;
  idleDraft: FocusIdleDraft;
  setIdleDraftState: Dispatch<SetStateAction<FocusIdleDraft>>;
  backlog: FocusBacklogItem[];
  setBacklog: Dispatch<SetStateAction<FocusBacklogItem[]>>;
  sessions: FocusSessionRecord[];
  setSessions: Dispatch<SetStateAction<FocusSessionRecord[]>>;
  activeTimer: ActiveTimer | null;
  setActiveTimer: Dispatch<SetStateAction<ActiveTimer | null>>;
  breakSuggestion: FocusBreakSuggestion | null;
  setBreakSuggestion: Dispatch<SetStateAction<FocusBreakSuggestion | null>>;
  isHydrated: boolean;
  setIsHydrated: Dispatch<SetStateAction<boolean>>;
};

export type FocusSessionStore = FocusSessionState & FocusSessionStateRefs;
