import { useCallback } from "react";
import { useTaskBoardState } from "@/hooks/useTaskBoardState";
import { Task } from "../components/Boards/KanbanBoard/types";

export function useKanbanTaskHandlers(
  options: UseKanbanTaskHandlersOptions = {},
) {
  const {
    selectedTask,
    parentTask,
    setSelectedTask,
    setParentTask,
    handleTaskClick: baseHandleTaskClick,
    handleCloseDialog: baseHandleCloseDialog,
    handleSubtaskClick: baseHandleSubtaskClick,
  } = useTaskBoardState();

  const { onTaskOpen, onTaskClose, onSubtaskOpen } = options;

  const handleTaskClick = useCallback(
    (task: Task) => {
      baseHandleTaskClick(task);
      onTaskOpen?.(task);
    },
    [baseHandleTaskClick, onTaskOpen],
  );

  const handleCloseDialog = useCallback(() => {
    onTaskClose?.();
    baseHandleCloseDialog();
  }, [baseHandleCloseDialog, onTaskClose]);

  const handleSubtaskClick = useCallback(
    (subtask: Task) => {
      if (selectedTask) onSubtaskOpen?.(selectedTask, subtask);
      baseHandleSubtaskClick(subtask);
    },
    [selectedTask, onSubtaskOpen, baseHandleSubtaskClick],
  );

  return {
    selectedTask,
    parentTask,
    setSelectedTask,
    setParentTask,
    handleTaskClick,
    handleCloseDialog,
    handleSubtaskClick,
  };
}

interface UseKanbanTaskHandlersOptions {
  onTaskOpen?: (task: Task) => void;
  onTaskClose?: () => void;
  onSubtaskOpen?: (parentTask: Task, subtask: Task) => void;
}
