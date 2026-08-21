import type { TimerMode } from "../shared/records.types";
import type {
  AppSettings,
  DurationPreset,
  MenuBarClockStyle,
} from "../shared/settings.types";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultMode: "stopwatch",
  durationPreset: "last",
  lastDurationMinutes: 25,
  soundEnabled: true,
  soundVolume: 0.8,
  menuBarClockVisible: true,
  menuBarClockStyle: "auto",
  alwaysOnTop: false,
  confirmOnStop: true,
  defaultSaveNewSessions: false,
  sidebarCollapsed: false,
};

export function mergeAppSettings(
  current: AppSettings,
  patch: Partial<AppSettings>,
): AppSettings {
  return {
    defaultMode: parseTimerMode(patch.defaultMode, current.defaultMode),
    durationPreset: parseDurationPreset(
      patch.durationPreset,
      current.durationPreset,
    ),
    lastDurationMinutes: parseDurationMinutes(
      patch.lastDurationMinutes,
      current.lastDurationMinutes,
    ),
    soundEnabled: parseBoolean(patch.soundEnabled, current.soundEnabled),
    soundVolume: parseVolume(patch.soundVolume, current.soundVolume),
    menuBarClockVisible: parseBoolean(
      patch.menuBarClockVisible,
      current.menuBarClockVisible,
    ),
    menuBarClockStyle: parseMenuBarClockStyle(
      patch.menuBarClockStyle,
      current.menuBarClockStyle,
    ),
    alwaysOnTop: parseBoolean(patch.alwaysOnTop, current.alwaysOnTop),
    confirmOnStop: parseBoolean(patch.confirmOnStop, current.confirmOnStop),
    defaultSaveNewSessions: parseBoolean(
      patch.defaultSaveNewSessions,
      current.defaultSaveNewSessions,
    ),
    sidebarCollapsed: parseBoolean(
      patch.sidebarCollapsed,
      current.sidebarCollapsed,
    ),
  };
}

export function parseStoredSettings(value: unknown): AppSettings {
  if (value === null || typeof value !== "object") {
    return DEFAULT_APP_SETTINGS;
  }

  return mergeAppSettings(DEFAULT_APP_SETTINGS, value as Partial<AppSettings>);
}

export function resolveDurationMinutes(settings: AppSettings): number {
  if (settings.durationPreset === "25") {
    return 25;
  }
  if (settings.durationPreset === "50") {
    return 50;
  }
  return settings.lastDurationMinutes;
}

function parseTimerMode(value: unknown, fallback: TimerMode): TimerMode {
  return value === "timer" || value === "stopwatch" ? value : fallback;
}

function parseDurationPreset(
  value: unknown,
  fallback: DurationPreset,
): DurationPreset {
  return value === "last" || value === "25" || value === "50"
    ? value
    : fallback;
}

function parseMenuBarClockStyle(
  value: unknown,
  fallback: MenuBarClockStyle,
): MenuBarClockStyle {
  return value === "auto" || value === "elapsed" || value === "remaining"
    ? value
    : fallback;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function parseDurationMinutes(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(60, Math.max(1, Math.round(value)));
}

function parseVolume(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, value));
}
