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
import { useTaskBoardState, updateTaskInColumns } from "@/hooks/useTaskBoardState";

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

  const {
    selectedTask,
    parentTask,
    setSelectedTask,
    handleTaskClick,
    handleCloseModal,
    handleSubtaskClick,
  } = useTaskBoardState();

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

  const handleTaskUpdate = useCallback(
    (updatedTask: Task) => {
      setTasks((prevTasks) => updateTaskInColumns(prevTasks, updatedTask));
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
    },
    [selectedTask, setSelectedTask],
  );

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
        parentTask={parentTask}
        workspaceTitle={workspaceTitle}
        onClose={handleCloseModal}
        onTaskUpdate={handleTaskUpdate}
        onSubtaskClick={handleSubtaskClick}
      />
    </>
  );
}
