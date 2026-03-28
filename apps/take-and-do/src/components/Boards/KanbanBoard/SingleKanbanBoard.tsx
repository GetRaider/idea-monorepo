"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BoardContainer,
  Board,
  LoadingContainer,
  KanbanSpinner,
  EmptyStateWrapper,
} from "./KanbanBoard.ui";
import { Toolbar } from "./shared/Toolbar";
import { KanbanColumns } from "./shared/KanbanColumns";
import { TaskStatus, Task, emptyTaskColumns } from "./types";
import { handleSingleBoardTaskStatusChange } from "./shared/taskStatusHandlers";
import {
  composedDataToTask,
  createNewTaskTemplate,
} from "./shared/taskComposeHelpers";
import { useKanbanTaskHandlers } from "../../../hooks/useKanbanTaskHandlers";
import { useBoardUrlTaskDialogSync } from "@/hooks/useBoardUrlTaskDialogSync";
import { TaskView } from "../../TaskView/TaskView";
import {
  removeTaskFromColumns,
  updateTaskInColumns,
} from "@/hooks/useTaskBoardState";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { EmptyState } from "../../EmptyState";
import { AIComposeDialog } from "./shared/AIComposeDialog";
import { apiServices } from "@/services/api";

interface SingleKanbanBoardProps {
  boardId: string;
  boardName: string;
  boardEmoji?: string | null;
  onTaskOpen?: (task: Task) => void;
  onTaskClose?: () => void;
  onSubtaskOpen?: (parentTask: Task, subtask: Task) => void;
}

export function SingleKanbanBoard({
  boardId,
  boardName,
  boardEmoji,
  onTaskOpen,
  onTaskClose,
  onSubtaskOpen,
}: SingleKanbanBoardProps) {
  const router = useRouter();
  const { taskBoards } = useWorkspace();
  const boardOptions = useMemo(
    () => taskBoards.map((b) => ({ id: b.id, name: b.name })),
    [taskBoards],
  );

  const [tasksByStatus, setTasksByStatus] =
    useState<Record<TaskStatus, Task[]>>(emptyTaskColumns);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIComposeDialogOpen, setIsAIComposeDialogOpen] = useState(false);
  const fetchSeqRef = useRef(0);
  const isMountedRef = useRef(true);

  const {
    selectedTask,
    parentTask,
    setSelectedTask,
    setParentTask,
    handleTaskClick,
    handleCloseDialog,
    handleSubtaskClick,
  } = useKanbanTaskHandlers({ onTaskOpen, onTaskClose, onSubtaskOpen });

  const { handleCloseBoardDialog } = useBoardUrlTaskDialogSync({
    boardName,
    tasksByStatus,
    isLoading,
    selectedTask,
    parentTask,
    setSelectedTask,
    setParentTask,
    handleCloseDialog,
    onTaskOpen,
  });

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

  const handleNavigateToParentTask = useCallback(() => {
    if (!parentTask?.taskKey) return;
    tasksUrlHelper.modal.board.open(boardName, parentTask);
    setSelectedTask(parentTask);
    setParentTask(null);
  }, [parentTask, boardName, setSelectedTask, setParentTask]);

  const handleTaskUpdate = useCallback(
    (updatedTask: Task) => {
      if (
        selectedTask?.id === updatedTask.id &&
        updatedTask.taskBoardId !== boardId
      ) {
        setTasksByStatus((prev) => removeTaskFromColumns(prev, updatedTask.id));
        const newBoard = taskBoards.find(
          (b) => b.id === updatedTask.taskBoardId,
        );
        if (newBoard?.name && updatedTask.taskKey) {
          router.push(
            tasksUrlHelper.routing.buildBoardUrl(
              newBoard.name,
              updatedTask.taskKey,
            ),
          );
        }
        return;
      }

      setTasksByStatus((prevTasksByStatus) =>
        updateTaskInColumns(prevTasksByStatus, updatedTask),
      );
      if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
      }
    },
    [selectedTask, setSelectedTask, boardId, taskBoards, router],
  );

  const handleCreateTask = useCallback(() => {
    if (!boardId) {
      console.error("Cannot create task: taskBoardId not found");
      return;
    }
    setSelectedTask(createNewTaskTemplate({ taskBoardId: boardId }));
  }, [boardId, setSelectedTask]);

  const handleCreateTaskWithAI = useCallback(() => {
    setIsAIComposeDialogOpen(true);
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
    [fetchTasks, setSelectedTask],
  );

  const handleTaskDelete = useCallback(() => {
    fetchTasks();
    setSelectedTask(null);
  }, [fetchTasks, setSelectedTask]);

  const totalTasksLength =
    tasksByStatus[TaskStatus.TODO].length +
    tasksByStatus[TaskStatus.IN_PROGRESS].length +
    tasksByStatus[TaskStatus.DONE].length;

  return (
    <>
      <BoardContainer>
        <Toolbar
          workspaceTitle={boardName}
          workspaceEmoji={boardEmoji}
          onCreateTask={handleCreateTask}
          onCreateTaskWithAI={handleCreateTaskWithAI}
          boardId={boardId}
        />

        <Board fillHeight>
          {isLoading ? (
            <LoadingContainer>
              <KanbanSpinner />
            </LoadingContainer>
          ) : (
            <BoardContent
              totalTasksLength={totalTasksLength}
              tasksByStatus={tasksByStatus}
              handleTaskStatusChange={handleTaskStatusChange}
              handleTaskClick={handleTaskClick}
              boardName={boardName}
            />
          )}
        </Board>
      </BoardContainer>
      <TaskView
        task={selectedTask}
        parentTask={parentTask}
        boardName={boardName}
        boardOptions={boardOptions}
        onClose={handleCloseBoardDialog}
        onTaskUpdate={handleTaskUpdate}
        onSubtaskClick={handleSubtaskClick}
        onTaskCreated={handleTaskCreated}
        onTaskDelete={handleTaskDelete}
        onNavigateToParentTask={handleNavigateToParentTask}
      />
      <AIComposeDialog
        isOpen={isAIComposeDialogOpen}
        onClose={() => setIsAIComposeDialogOpen(false)}
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
  boardName,
}: BoardContentProps) {
  return totalTasksLength === 0 ? (
    <EmptyStateWrapper>
      <EmptyState
        title="No tasks"
        message={`No tasks in the '${boardName}' board`}
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
  boardName: string;
}
