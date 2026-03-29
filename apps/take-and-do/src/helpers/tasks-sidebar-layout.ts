export const TASKS_SIDEBAR_NAV_RAIL_PX = 60;
export const TASKS_SIDEBAR_MIN_WIDTH_PX = 180;
export const TASKS_SIDEBAR_MAX_WIDTH_PX = 320;
export const TASKS_SIDEBAR_DEFAULT_WIDTH_PX = 220;
export const TASKS_SIDEBAR_WIDTH_STORAGE_KEY =
  "take-and-do.tasks-sidebar-width-px";

export function clampTasksSidebarWidthPx(width: number): number {
  return Math.min(
    TASKS_SIDEBAR_MAX_WIDTH_PX,
    Math.max(TASKS_SIDEBAR_MIN_WIDTH_PX, Math.round(width)),
  );
}

export function readStoredTasksSidebarWidthPx(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TASKS_SIDEBAR_WIDTH_STORAGE_KEY);
  if (raw == null) return null;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return null;
  return clampTasksSidebarWidthPx(parsed);
}
