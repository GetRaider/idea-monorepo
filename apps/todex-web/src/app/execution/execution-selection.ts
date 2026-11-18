const SELECTED_TASK_KEY = "todex.execution.selectedTask";

export function readSelectedTask(): StoredTaskSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SELECTED_TASK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredTaskSelection>;
    if (typeof parsed.sessionId !== "string") return null;
    return {
      sessionId: parsed.sessionId,
      taskId: typeof parsed.taskId === "string" ? parsed.taskId : null,
    };
  } catch {
    return null;
  }
}

export function writeSelectedTask(sessionId: string, taskId: string | null) {
  if (typeof window === "undefined") return;
  const value: StoredTaskSelection = { sessionId, taskId };
  window.sessionStorage.setItem(SELECTED_TASK_KEY, JSON.stringify(value));
}

interface StoredTaskSelection {
  sessionId: string;
  taskId: string | null;
}
