import type { TaskPriority, TaskStatus } from "../../KanbanBoard/types";

export interface QuickCreateTaskInput {
  summary: string;
  priority: TaskPriority;
  status: TaskStatus;
  scheduleDate?: Date;
  dueDate?: Date;
  estimation?: number;
  taskBoardId: string;
}

export interface QuickCreateTaskRowBoardOption {
  id: string;
  name: string;
  emoji?: string | null;
}

export interface QuickCreateTaskRowProps {
  /** Submit handler — should resolve once the create has been persisted. */
  onCreate: (input: QuickCreateTaskInput) => Promise<void> | void;
  /** Status the new task lands in. Defaults to TaskStatus.TODO. */
  defaultStatus?: TaskStatus;
  defaultPriority?: TaskPriority;
  defaultScheduleDate?: Date;
  /**
   * Single-board mode: the board id used for every created task.
   * Multi-board mode: leave undefined and pass `boardOptions` instead.
   */
  taskBoardId?: string;
  /** When provided, a board picker chip is shown next to priority/schedule. */
  boardOptions?: QuickCreateTaskRowBoardOption[];
  /** Default selected board for multi-board mode. */
  defaultBoardId?: string;
  /** Label for the collapsed row. Defaults to "Create a new task". */
  triggerLabel?: string;
  className?: string;
}
