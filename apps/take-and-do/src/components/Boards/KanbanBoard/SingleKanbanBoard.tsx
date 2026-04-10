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
import { useKanbanTaskHandlers } from "../../../hooks/tasks/useKanbanTaskHandlers";
import { useBoardUrlTaskDialogSync } from "@/hooks/tasks/useBoardUrlTaskDialogSync";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { useTaskActions } from "@/hooks/tasks/useTasks";
import { GUEST_STORE_UPDATED_EVENT } from "@/stores/guest/constants";
import { guestStoreHelper } from "@/stores/guest";
import { guestTasksForBoard } from "@/stores/guest/guest-task-filters";
import { TaskView } from "../../TaskView/TaskView";
import {
  removeTaskFromColumns,
  updateTaskInColumns,
} from "@/hooks/tasks/useTaskBoardState";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { EmptyState } from "../../EmptyState";
import { AIComposeDialog } from "./shared/AIComposeDialog";
import { clientServices } from "@/services";
import { toast } from "sonner";

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
  const isAnonymous = useIsAnonymous();
  const { updateTask } = useTaskActions();
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

  const persistTaskStatus = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const updated = await updateTask(taskId, { status: newStatus });
      if (!updated) toast.error("Can't update task status");
    },
    [updateTask],
  );

  const fetchTasks = useCallback(async () => {
    if (!boardId) return;

    const seq = ++fetchSeqRef.current;
    setIsLoading(true);
    try {
      const tasks = isAnonymous
        ? guestTasksForBoard(guestStoreHelper.getTasks(), boardId)
        : await clientServices.tasks.getByBoardId(boardId);
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
    } finally {
      if (!isMountedRef.current || seq !== fetchSeqRef.current) return;
      setIsLoading(false);
    }
  }, [boardId, isAnonymous]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!isAnonymous) return;
    const onGuestStoreUpdated = () => {
      void fetchTasks();
    };
    window.addEventListener(GUEST_STORE_UPDATED_EVENT, onGuestStoreUpdated);
    return () =>
      window.removeEventListener(
        GUEST_STORE_UPDATED_EVENT,
        onGuestStoreUpdated,
      );
  }, [isAnonymous, fetchTasks]);

  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus, targetIndex?: number) => {
      await handleSingleBoardTaskStatusChange(
        tasksByStatus,
        setTasksByStatus,
        taskId,
        newStatus,
        targetIndex,
        persistTaskStatus,
      );
    },
    [tasksByStatus, persistTaskStatus],
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
      const composedData = await clientServices.tasks.composeWithAI({
        text,
        taskBoardId: boardId,
      });
      if (composedData) {
        setSelectedTask(composedDataToTask(composedData));
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
