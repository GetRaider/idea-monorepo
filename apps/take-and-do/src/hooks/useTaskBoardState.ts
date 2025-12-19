import { useState, useCallback } from "react";
import { Task, TaskStatus } from "@/components/KanbanBoard/types";

interface UseTaskBoardStateReturn {
  selectedTask: Task | null;
  parentTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  setParentTask: (task: Task | null) => void;
  handleTaskClick: (task: Task) => void;
  handleCloseModal: () => void;
  handleSubtaskClick: (subtask: Task) => void;
}

export function useTaskBoardState(): UseTaskBoardStateReturn {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setParentTask(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTask(null);
    setParentTask(null);
  }, []);

  const handleSubtaskClick = useCallback(
    (subtask: Task) => {
      setParentTask(selectedTask);
      setSelectedTask(subtask);
    },
    [selectedTask],
  );

  return {
    selectedTask,
    parentTask,
    setSelectedTask,
    setParentTask,
    handleTaskClick,
    handleCloseModal,
    handleSubtaskClick,
  };
}

/**
 * Updates a task within a status-grouped task record.
 * Handles both top-level tasks and subtasks.
 */
export function updateTaskInColumns(
  tasks: Record<TaskStatus, Task[]>,
  updatedTask: Task,
): Record<TaskStatus, Task[]> {
  const newTasks = { ...tasks };

  // Check if this is a top-level task
  const isTopLevelTask = Object.values(newTasks).some((taskList) =>
    taskList.some((t) => t.id === updatedTask.id),
  );

  if (isTopLevelTask) {
    // Remove from old status, add to new status
    for (const status of Object.values(TaskStatus)) {
      newTasks[status] = newTasks[status].filter((t) => t.id !== updatedTask.id);
    }
    newTasks[updatedTask.status].push(updatedTask);
  } else {
    // Update subtask within parent
    for (const status of Object.values(TaskStatus)) {
      newTasks[status] = newTasks[status].map((task) => {
        if (task.subtasks?.some((st) => st.id === updatedTask.id)) {
          return {
            ...task,
            subtasks: task.subtasks.map((st) =>
              st.id === updatedTask.id ? updatedTask : st,
            ),
          };
        }
        return task;
      });
    }
  }

  return newTasks;
}

