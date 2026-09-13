export const TASKS_CREATE_TASK_EVENT = "todex:tasks-create-task";

export function requestQuickCreateTask() {
  window.dispatchEvent(new Event(TASKS_CREATE_TASK_EVENT));
}
