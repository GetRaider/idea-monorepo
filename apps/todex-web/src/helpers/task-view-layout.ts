import {
  clampPanelWidth,
  parseStoredPanelWidth,
  parseTaskViewMode,
  TASK_PANEL_DEFAULT_WIDTH,
  TASK_PANEL_MAX_WIDTH,
  TASK_PANEL_MIN_WIDTH,
  type TaskViewMode,
} from "./panel-layout";

const MODE_STORAGE_KEY = "todex:task-view-mode";
const WIDTH_STORAGE_KEY = "todex:task-panel-width";

export function readTaskViewMode(): TaskViewMode {
  try {
    return parseTaskViewMode(localStorage.getItem(MODE_STORAGE_KEY));
  } catch {
    return "docked";
  }
}

export function writeTaskViewMode(mode: TaskViewMode): void {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    /* private mode / quota */
  }
}

export function readTaskPanelWidth(): number {
  try {
    return parseStoredPanelWidth(
      localStorage.getItem(WIDTH_STORAGE_KEY),
      TASK_PANEL_DEFAULT_WIDTH,
      TASK_PANEL_MIN_WIDTH,
      TASK_PANEL_MAX_WIDTH,
    );
  } catch {
    return TASK_PANEL_DEFAULT_WIDTH;
  }
}

export function writeTaskPanelWidth(width: number): void {
  try {
    localStorage.setItem(
      WIDTH_STORAGE_KEY,
      String(
        clampPanelWidth(width, TASK_PANEL_MIN_WIDTH, TASK_PANEL_MAX_WIDTH),
      ),
    );
  } catch {
    /* private mode / quota */
  }
}
