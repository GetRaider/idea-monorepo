const STORAGE_KEY = "todex:tasks-sidebar-open";

export function readTasksSidebarOpen(): boolean {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === null) return true;
    return value !== "false";
  } catch {
    return true;
  }
}

export function writeTasksSidebarOpen(shouldOpen: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, shouldOpen ? "true" : "false");
  } catch {
    /* private mode / quota */
  }
}
