import {
  clampPanelWidth,
  parseStoredPanelWidth,
  TASKS_SIDEBAR_DEFAULT_WIDTH,
  TASKS_SIDEBAR_MAX_WIDTH,
  TASKS_SIDEBAR_MIN_WIDTH,
} from "./panel-layout";

const WIDTH_STORAGE_KEY = "todex:tasks-sidebar-width";

export function readTasksSidebarWidth(): number {
  try {
    return parseStoredPanelWidth(
      localStorage.getItem(WIDTH_STORAGE_KEY),
      TASKS_SIDEBAR_DEFAULT_WIDTH,
      TASKS_SIDEBAR_MIN_WIDTH,
      TASKS_SIDEBAR_MAX_WIDTH,
    );
  } catch {
    return TASKS_SIDEBAR_DEFAULT_WIDTH;
  }
}

export function writeTasksSidebarWidth(width: number): void {
  try {
    localStorage.setItem(
      WIDTH_STORAGE_KEY,
      String(
        clampPanelWidth(
          width,
          TASKS_SIDEBAR_MIN_WIDTH,
          TASKS_SIDEBAR_MAX_WIDTH,
        ),
      ),
    );
  } catch {
    /* private mode / quota */
  }
}
