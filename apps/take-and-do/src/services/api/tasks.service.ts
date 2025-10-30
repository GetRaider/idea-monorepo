import { Task } from "@/components/KanbanBoard/KanbanBoard";

export const tasksService = {
  async getBySchedule(schedule: "today" | "tomorrow"): Promise<{
    today: Task[];
    tomorrow: Task[];
  }> {
    const response = await fetch(`/api/tasks/scheduled?schedule=${schedule}`);
    if (!response.ok) {
      throw new Error("Failed to fetch scheduled tasks");
    }
    const data = await response.json();
    // Convert date strings back to Date objects
    return {
      today:
        data.today?.map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        })) || [],
      tomorrow:
        data.tomorrow?.map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        })) || [],
    };
  },

  async create(task: Omit<Task, "id">): Promise<Task> {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      throw new Error("Failed to create task");
    }
    const createdTask = await response.json();
    return {
      ...createdTask,
      dueDate: createdTask.dueDate ? new Date(createdTask.dueDate) : undefined,
    };
  },

  async update(taskId: string, updates: Partial<Task>): Promise<Task> {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error("Failed to update task");
    }
    const updatedTask = await response.json();
    return {
      ...updatedTask,
      dueDate: updatedTask.dueDate ? new Date(updatedTask.dueDate) : undefined,
    };
  },
};
