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

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const taskBoardNamesMap = await fetchTaskBoardNameMap();
        setTaskBoardNameMap(taskBoardNamesMap);

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

  return (
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
            />
            <Column
              tasks={tasks[TaskStatus.IN_PROGRESS]}
              status={TaskStatus.IN_PROGRESS}
              onTaskDrop={handleTaskStatusChange}
            />
            <Column
              tasks={tasks[TaskStatus.DONE]}
              status={TaskStatus.DONE}
              onTaskDrop={handleTaskStatusChange}
            />
          </>
        )}
      </Board>
    </BoardContainer>
  );
}
