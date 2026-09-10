import type { FocusRecord } from "../shared/records.types";

export function resolveFocusViewState(
  focus: FocusRecord | null,
  breakRecord: FocusRecord | null,
): FocusViewState {
  if (focus === null && breakRecord === null) {
    return "idle";
  }

  if (focus === null && breakRecord !== null) {
    return "breakOnly";
  }

  if (focus !== null && breakRecord !== null) {
    return "focusPausedBreakRunning";
  }

  if (focus !== null && focus.segmentStartedAt !== null) {
    return "focusRunning";
  }

  return "focusPaused";
}

export type FocusViewState =
  | "idle"
  | "focusRunning"
  | "focusPaused"
  | "focusPausedBreakRunning"
  | "breakOnly";
