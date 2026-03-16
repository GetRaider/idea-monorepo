import { useCallback } from "react";
import { useTaskBoardState } from "@/hooks/useTaskBoardState";
import { Task } from "../types";

interface UseKanbanTaskHandlersOptions {
  onTaskOpen?: (task: Task) => void;
  onTaskClose?: () => void;
  onSubtaskOpen?: (parentTask: Task, subtask: Task) => void;
}

export function useKanbanTaskHandlers(options: UseKanbanTaskHandlersOptions = {}) {
  const {
    selectedTask,
    parentTask,
    setSelectedTask,
    handleTaskClick: baseHandleTaskClick,
    handleCloseModal: baseHandleCloseModal,
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

  const handleCloseModal = useCallback(() => {
    baseHandleCloseModal();
    onTaskClose?.();
  }, [baseHandleCloseModal, onTaskClose]);

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
    handleTaskClick,
    handleCloseModal,
    handleSubtaskClick,
  };
}
