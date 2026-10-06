export const TASKS_SIDEBAR_DEFAULT_WIDTH = 240;
export const TASKS_SIDEBAR_MIN_WIDTH = 180;
export const TASKS_SIDEBAR_MAX_WIDTH = 360;

export const TASK_PANEL_DEFAULT_WIDTH = 480;
export const TASK_PANEL_MIN_WIDTH = 360;
export const TASK_PANEL_MAX_WIDTH = 720;

export function clampPanelWidth(
  width: number,
  min: number,
  max: number,
): number {
  if (!Number.isFinite(width)) return min;
  return Math.min(max, Math.max(min, Math.round(width)));
}

export function parseStoredPanelWidth(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === null || value.trim() === "") return fallback;
  return clampPanelWidth(Number(value), min, max);
}

export function parseTaskViewMode(value: string | null): TaskViewMode {
  return value === "fullscreen" ? "fullscreen" : "docked";
}

export type TaskViewMode = "docked" | "fullscreen";
