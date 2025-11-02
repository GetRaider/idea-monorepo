export enum TaskStatus {
  TODO = "To Do",
  IN_PROGRESS = "In Progress",
  DONE = "Done",
}

export enum TaskSchedule {
  TODAY = "today",
  TOMORROW = "tomorrow",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface Task {
  id: string;
  taskBoardId: string;
  taskKey?: string;
  summary: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  labels?: string[];
  dueDate?: Date;
  estimation?: number;
  subtasks?: Task[];
  schedule?: "today" | "tomorrow";
}

export interface TaskGroup {
  taskBoardId: string;
  taskBoardName: string;
  tasks: Record<TaskStatus, Task[]>;
}

export interface LoadScheduledWorkspaceProps {
  schedule: TaskSchedule;
  taskBoardNamesMap: Record<string, string>;
  setTaskGroups: (groups: TaskGroup[]) => void;
}

export interface LoadTaskBoardWorkspaceProps {
  boardName: string;
  taskBoardNamesMap: Record<string, string>;
  setTasks: (tasks: Record<TaskStatus, Task[]>) => void;
}

export const emptyTaskColumns: Record<TaskStatus, Task[]> = {
  [TaskStatus.TODO]: [],
  [TaskStatus.IN_PROGRESS]: [],
  [TaskStatus.DONE]: [],
};

export function toTaskStatus(status: any): TaskStatus {
  return Object.values(TaskStatus).includes(status as TaskStatus)
    ? (status as TaskStatus)
    : TaskStatus.TODO;
}

export function toTaskPriority(priority: any): TaskPriority {
  if (!priority) return TaskPriority.MEDIUM;

  const priorityString = String(priority).toLowerCase();
  const validPriorities = Object.values(TaskPriority) as string[];

  if (validPriorities.includes(priorityString)) {
    return priorityString as TaskPriority;
  }

  return TaskPriority.MEDIUM;
}

export function createEmptyStatusBuckets(): Record<TaskStatus, Task[]> {
  return {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.DONE]: [],
  };
}

export function createTaskGroups(
  tasks: Task[],
  taskBoardNameMap: Record<string, string>,
): TaskGroup[] {
  const groupsMap: Record<string, Record<TaskStatus, Task[]>> = {};

  (tasks || []).forEach((task) => {
    if (!task.taskBoardId) return;

    const groupKey = task.taskBoardId;

    if (!groupsMap[groupKey]) {
      groupsMap[groupKey] = createEmptyStatusBuckets();
    }
    if (task.dueDate) {
      task.dueDate = new Date(task.dueDate);
    }
    task.status = toTaskStatus(task.status);
    task.priority = toTaskPriority(task.priority);
    groupsMap[groupKey][task.status].push(task);
  });

  return Object.entries(groupsMap).map(([groupKey, tasksByStatus]) => ({
    taskBoardId: groupKey,
    taskBoardName: taskBoardNameMap[groupKey] ?? groupKey,
    tasks: tasksByStatus,
  }));
}

