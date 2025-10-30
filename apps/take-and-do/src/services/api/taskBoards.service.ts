import { TaskBoard } from "@/types/workspace";
import { Task } from "@/components/KanbanBoard/KanbanBoard";

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
    const response = await fetch(`/api/task-boards/${taskBoardId}/tasks`);
    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }
    const tasks = await response.json();
    // Convert date strings back to Date objects
    return tasks.map((task: Task) => ({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    }));
  },
};
