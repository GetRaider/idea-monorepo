"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BoardContainer,
  Board,
  LoadingContainer,
  Spinner,
} from "./KanbanBoard.styles";
import { Column } from "./Column/Column";
import { Toolbar } from "./shared/Toolbar";
import { TaskStatus, Task, emptyTaskColumns } from "./types";
import {
  fetchTaskBoardNameMap,
  loadTaskBoardContent,
} from "./shared/dataLoaders";
import { handleSingleBoardTaskStatusChange } from "./shared/taskStatusHandlers";
import TaskView from "../TaskView/TaskView";

interface SingleKanbanBoardProps {
  boardName: string;
  workspaceTitle: string;
}

export function SingleKanbanBoard({
  boardName,
  workspaceTitle,
}: SingleKanbanBoardProps) {
  const [tasks, setTasks] =
    useState<Record<TaskStatus, Task[]>>(emptyTaskColumns);
  const [isLoading, setIsLoading] = useState(true);
  const [taskBoardNameMap, setTaskBoardNameMap] = useState<
    Record<string, string>
  >({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const taskBoardNamesMap = await fetchTaskBoardNameMap();

        await loadTaskBoardContent({
          boardName,
          taskBoardNamesMap,
          setTasks,
        });
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setTasks(emptyTaskColumns);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [boardName]);

  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus, targetIndex?: number) => {
      await handleSingleBoardTaskStatusChange(
        tasks,
        setTasks,
        taskId,
        newStatus,
        targetIndex,
      );
    },
    [tasks],
  );

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTask(null);
  }, []);

  const handleTaskUpdate = useCallback(
    async (updatedTask: Task) => {
      // Update the task in the local state
      setTasks((prevTasks) => {
        const newTasks = { ...prevTasks };
        // Remove task from old status
        Object.keys(newTasks).forEach((status) => {
          newTasks[status as TaskStatus] = newTasks[
            status as TaskStatus
          ].filter((t) => t.id !== updatedTask.id);
        });
        // Add task to new status
        newTasks[updatedTask.status].push(updatedTask);
        return newTasks;
      });
      // Update selected task if it's the same one
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
    },
    [selectedTask],
  );

  const handleSubtaskClick = useCallback((subtask: Task) => {
    setSelectedTask(subtask);
  }, []);

  return (
    <>
      <BoardContainer>
        <Toolbar workspaceTitle={workspaceTitle} />

        <Board>
          {isLoading ? (
            <LoadingContainer>
              <Spinner />
            </LoadingContainer>
          ) : (
            <>
              <Column
                tasks={tasks[TaskStatus.TODO]}
                status={TaskStatus.TODO}
                onTaskDrop={handleTaskStatusChange}
                onTaskClick={handleTaskClick}
              />
              <Column
                tasks={tasks[TaskStatus.IN_PROGRESS]}
                status={TaskStatus.IN_PROGRESS}
                onTaskDrop={handleTaskStatusChange}
                onTaskClick={handleTaskClick}
              />
              <Column
                tasks={tasks[TaskStatus.DONE]}
                status={TaskStatus.DONE}
                onTaskDrop={handleTaskStatusChange}
                onTaskClick={handleTaskClick}
              />
            </>
          )}
        </Board>
      </BoardContainer>
      <TaskView
        task={selectedTask}
        workspaceTitle={workspaceTitle}
        onClose={handleCloseModal}
        onTaskUpdate={handleTaskUpdate}
        onSubtaskClick={handleSubtaskClick}
      />
    </>
  );
}
