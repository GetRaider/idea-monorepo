import type { Task, TaskUpdate } from "@/components/Boards/KanbanBoard/types";

export type TaskMetadataProps = {
  task: Task;
  initialTask: Task | null;
  isCreating?: boolean;
  onTaskChange?: (task: Task) => void;
  onPendingMetadataUpdates?: (updates: TaskUpdate) => void;
};
