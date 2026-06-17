import { clientServices } from "@/services";
import {
  writeFocusActiveTimer,
  writeFocusBacklogStore,
  writeFocusBreakSuggestion,
  writeFocusDraft,
  writeFocusSessionsStore,
} from "@/hooks/focus/focus-storage";

import type { FocusBacklogItem, FocusSessionRecord } from "@/types/focus.types";

export async function hydratePersistedFocusState(
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

export function resetLocalFocusPersistence(): void {
  writeFocusSessionsStore({ version: 2, items: [] });
  writeFocusBacklogStore({ version: 2, items: [] });
  writeFocusActiveTimer(null);
  writeFocusDraft(null);
  writeFocusBreakSuggestion(null);
}
