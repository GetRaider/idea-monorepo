"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BoardContainer,
  Board,
  LoadingContainer,
  Spinner,
  EmptyStateWrapper,
} from "./KanbanBoard.styles";
import { Toolbar } from "./shared/Toolbar";
import { KanbanColumns } from "./shared/KanbanColumns";
import { TaskStatus, Task, emptyTaskColumns } from "./types";
import { handleSingleBoardTaskStatusChange } from "./shared/taskStatusHandlers";
import {
  composedDataToTask,
  createNewTaskTemplate,
} from "./shared/taskComposeHelpers";
import { useKanbanTaskHandlers } from "../../../hooks/useKanbanTaskHandlers";
import { TaskView } from "../../TaskView/TaskView";
import { updateTaskInColumns } from "@/hooks/useTaskBoardState";
import { EmptyState } from "../../EmptyState";
import { AIComposeModal } from "./shared/AIComposeModal";
import { apiServices } from "@/services/api";

interface SingleKanbanBoardProps {
  boardId: string;
  workspaceTitle: string;
  boardEmoji?: string | null;
  onTaskOpen?: (task: Task) => void;
  onTaskClose?: () => void;
  onSubtaskOpen?: (parentTask: Task, subtask: Task) => void;
}

export function SingleKanbanBoard({
  boardId,
  workspaceTitle,
  boardEmoji,
  onTaskOpen,
  onTaskClose,
  onSubtaskOpen,
}: SingleKanbanBoardProps) {
  const [tasksByStatus, setTasksByStatus] =
    useState<Record<TaskStatus, Task[]>>(emptyTaskColumns);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIComposeModalOpen, setIsAIComposeModalOpen] = useState(false);
  const fetchSeqRef = useRef(0);
  const isMountedRef = useRef(true);

  const {
    selectedTask,
    parentTask,
    setSelectedTask,
    handleTaskClick,
    handleCloseModal,
    handleSubtaskClick,
  } = useKanbanTaskHandlers({ onTaskOpen, onTaskClose, onSubtaskOpen });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!boardId) return;

    const seq = ++fetchSeqRef.current;
    setIsLoading(true);
    try {
      const tasks = await apiServices.tasks.getByBoardId(boardId);
      const tasksByStatusMap: Record<TaskStatus, Task[]> = {
        [TaskStatus.TODO]: [],
        [TaskStatus.IN_PROGRESS]: [],
        [TaskStatus.DONE]: [],
      };
      tasks.forEach((task) => {
        const safeStatus = (Object.values(TaskStatus) as string[]).includes(
          task.status as unknown as string,
        )
          ? task.status
          : TaskStatus.TODO;
        tasksByStatusMap[safeStatus].push(task);
      });
      if (!isMountedRef.current || seq !== fetchSeqRef.current) return;
      setTasksByStatus(tasksByStatusMap);
    } catch (error) {
      if (!isMountedRef.current || seq !== fetchSeqRef.current) return;
      console.error("Failed to fetch tasks:", error);
      setTasksByStatus(emptyTaskColumns);
    } finally {
      if (!isMountedRef.current || seq !== fetchSeqRef.current) return;
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus, targetIndex?: number) => {
      await handleSingleBoardTaskStatusChange(
        tasksByStatus,
        setTasksByStatus,
        taskId,
        newStatus,
        targetIndex,
      );
    },
    [tasksByStatus],
  );

  const handleTaskUpdate = useCallback(
    (updatedTask: Task) => {
      setTasksByStatus((prevTasksByStatus) =>
        updateTaskInColumns(prevTasksByStatus, updatedTask),
      );
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
    },
    [selectedTask, setSelectedTask],
  );

  const handleCreateTask = useCallback(() => {
    if (!boardId) {
      console.error("Cannot create task: taskBoardId not found");
      return;
    }
    setSelectedTask(createNewTaskTemplate({ taskBoardId: boardId }));
  }, [boardId, setSelectedTask]);

  const handleCreateTaskWithAI = useCallback(() => {
    setIsAIComposeModalOpen(true);
  }, []);

  const handleAICompose = useCallback(
    async (text: string) => {
      if (!boardId) {
        console.error("Cannot compose task: taskBoardId not found");
        return;
      }
      try {
        const composedData = await apiServices.tasks.composeWithAI(
          text,
          boardId,
        );
        setSelectedTask(composedDataToTask(composedData));
      } catch (error) {
        console.error("Failed to compose task with AI:", error);
        throw error;
      }
    },
    [boardId, setSelectedTask],
  );

  const handleTaskCreated = useCallback(
    (createdTask: Task) => {
      fetchTasks();
      setSelectedTask(createdTask);
    },
    [fetchTasks],
  );

  const handleTaskDelete = useCallback(() => {
    fetchTasks();
    setSelectedTask(null);
  }, [fetchTasks]);

  const totalTasksLength =
    tasksByStatus[TaskStatus.TODO].length +
    tasksByStatus[TaskStatus.IN_PROGRESS].length +
    tasksByStatus[TaskStatus.DONE].length;

  return (
    <>
      <BoardContainer>
        <Toolbar
          workspaceTitle={workspaceTitle}
          workspaceEmoji={boardEmoji}
          onCreateTask={handleCreateTask}
          onCreateTaskWithAI={handleCreateTaskWithAI}
        />

        <Board $fillHeight>
          {isLoading ? (
            <LoadingContainer>
              <Spinner />
            </LoadingContainer>
          ) : (
            <BoardContent
              totalTasksLength={totalTasksLength}
              tasksByStatus={tasksByStatus}
              handleTaskStatusChange={handleTaskStatusChange}
              handleTaskClick={handleTaskClick}
              workspaceTitle={workspaceTitle}
            />
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
        onTaskCreated={handleTaskCreated}
        onTaskDelete={handleTaskDelete}
      />
      <AIComposeModal
        isOpen={isAIComposeModalOpen}
        onClose={() => setIsAIComposeModalOpen(false)}
        onCompose={handleAICompose}
      />
    </>
  );
}

function BoardContent({
  totalTasksLength,
  tasksByStatus,
  handleTaskStatusChange,
  handleTaskClick,
  workspaceTitle,
}: BoardContentProps) {
  return totalTasksLength === 0 ? (
    <EmptyStateWrapper>
      <EmptyState
        title="No tasks"
        message={`No tasks in '${workspaceTitle}' board`}
      />
    </EmptyStateWrapper>
  ) : (
    <KanbanColumns
      tasksByStatus={tasksByStatus}
      onTaskDrop={handleTaskStatusChange}
      onTaskClick={handleTaskClick}
    />
  );
}

interface BoardContentProps {
  totalTasksLength: number;
  tasksByStatus: Record<TaskStatus, Task[]>;
  handleTaskStatusChange: (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
  ) => void;
  handleTaskClick: (task: Task) => void;
  workspaceTitle: string;
}
