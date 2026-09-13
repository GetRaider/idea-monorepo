import type { TimerMode } from "./records.types";

export type DurationPreset = "last" | "10" | "30" | "60";

export type MenuBarClockStyle = "auto" | "elapsed" | "remaining";

export interface AppSettings {
  defaultMode: TimerMode;
  durationPreset: DurationPreset;
  lastDurationMinutes: number;
  soundEnabled: boolean;
  soundVolume: number;
  menuBarClockVisible: boolean;
  menuBarClockStyle: MenuBarClockStyle;
  alwaysOnTop: boolean;
  confirmOnStop: boolean;
  defaultSaveNewSessions: boolean;
  sidebarCollapsed: boolean;
  offerBreakTimer: boolean;
  breakDurationMinutes: number;
}
