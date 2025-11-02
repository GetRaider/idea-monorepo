import { TaskBoard } from "@/types/workspace";
import { Task, TaskPriority } from "@/components/KanbanBoard/types";

export const taskBoardsService = {
  async getAll(): Promise<TaskBoard[]> {
    const response = await fetch("/api/task-boards");
    if (!response.ok) {
      throw new Error("Failed to fetch task boards");
    }
    return response.json();
  },

  async getById(id: string): Promise<TaskBoard> {
    const response = await fetch(`/api/task-boards/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch task board");
    }
    return response.json();
  },

  async getTasks(taskBoardId: string): Promise<Task[]> {
    const response = await fetch(`/api/tasks?taskBoardId=${taskBoardId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }
    const tasks = await response.json();
    // Convert date strings back to Date objects and normalize priority
    return tasks.map((task: any) => {
      console.log(
        "Received task priority:",
        task.priority,
        "for task:",
        task.id,
      );
      return {
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        priority: normalizePriority(task.priority),
      };
    });
  },
};

function normalizePriority(priority: any): TaskPriority {
  console.log(
    "normalizePriority called with:",
    priority,
    "type:",
    typeof priority,
  );
  if (!priority) {
    console.log("Priority is falsy, returning MEDIUM");
    return TaskPriority.MEDIUM;
  }

  const priorityString = String(priority).toLowerCase();
  const validPriorities = Object.values(TaskPriority) as string[];
  console.log(
    "Priority string:",
    priorityString,
    "Valid priorities:",
    validPriorities,
  );

  if (validPriorities.includes(priorityString)) {
    console.log("Priority matched, returning:", priorityString);
    return priorityString as TaskPriority;
  }

  console.log("Priority didn't match, returning MEDIUM");
  return TaskPriority.MEDIUM;
}
