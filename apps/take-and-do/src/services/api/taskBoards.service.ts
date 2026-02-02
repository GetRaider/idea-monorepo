import { Task } from "@/components/KanbanBoard/types";
import { tasksHelper } from "@/helpers/task.helper";
import { TaskBoard } from "@/types/workspace";

import { BaseApiService } from "./base-api.service";

export class TaskBoardsService extends BaseApiService {
  constructor() {
    super("/task-boards");
  }

  async getAll(): Promise<TaskBoard[]> {
    const response = await this.get<TaskBoard[]>();
    return response.data.map(normalizeTaskBoard);
  }

  async getById(id: string): Promise<TaskBoard> {
    const response = await this.get<TaskBoard>({ pathParams: [id] });
    return normalizeTaskBoard(response.data);
  }

  async getTasks(taskBoardId: string): Promise<Task[]> {
    const response = await this.getAtPath<Task[]>(["tasks"], {
      taskBoardId,
    });
    return response.data.map(normalizeTask);
  }

  async create(
    taskBoard: Omit<TaskBoard, "id" | "createdAt" | "updatedAt">,
  ): Promise<TaskBoard> {
    const response = await this.post<TaskBoard>({ body: taskBoard });
    return normalizeTaskBoard(response.data);
  }
}

function normalizeTaskBoard(board: TaskBoard): TaskBoard {
  return {
    ...board,
    createdAt: new Date(board.createdAt),
    updatedAt: new Date(board.updatedAt),
  };
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    scheduleDate: task.scheduleDate ? new Date(task.scheduleDate) : undefined,
    priority: tasksHelper.priority.format(task.priority),
    subtasks: (task.subtasks ?? []).map(normalizeTask),
  };
}
