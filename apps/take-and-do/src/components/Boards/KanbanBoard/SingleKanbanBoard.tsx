"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import { useGuestTasks } from "@/hooks/tasks/use-guest-store";
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
import { queryKeys } from "@/lib/query-keys";
import { clientServices } from "@/services";
import { toast } from "sonner";

function tasksToColumns(tasks: Task[]): Record<TaskStatus, Task[]> {
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
  return tasksByStatusMap;
}

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
  const { tasks: guestTasks } = useGuestTasks();
  const { updateTask } = useTaskActions();
  const { taskBoards } = useWorkspace();
  const boardOptions = useMemo(
    () => taskBoards.map((b) => ({ id: b.id, name: b.name })),
    [taskBoards],
  );

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks.byBoard(boardId),
    queryFn: () => clientServices.tasks.getByBoardId(boardId),
    enabled: !isAnonymous && !!boardId,
  });

  const [tasksByStatus, setTasksByStatus] =
    useState<Record<TaskStatus, Task[]>>(emptyTaskColumns);
  const [isAIComposeDialogOpen, setIsAIComposeDialogOpen] = useState(false);

  useEffect(() => {
    if (isAnonymous) {
      setTasksByStatus(tasksToColumns(guestTasksForBoard(guestTasks, boardId)));
    }
  }, [isAnonymous, guestTasks, boardId]);

  useEffect(() => {
    if (isAnonymous) return;
    if (tasksQuery.data === undefined) return;
    setTasksByStatus(tasksToColumns(tasksQuery.data));
  }, [isAnonymous, tasksQuery.data, boardId]);

  useEffect(() => {
    if (!isAnonymous) return;
    const onGuestStoreUpdated = () => {
      setTasksByStatus(
        tasksToColumns(
          guestTasksForBoard(guestStoreHelper.getTasks(), boardId),
        ),
      );
    };
    window.addEventListener(GUEST_STORE_UPDATED_EVENT, onGuestStoreUpdated);
    return () =>
      window.removeEventListener(
        GUEST_STORE_UPDATED_EVENT,
        onGuestStoreUpdated,
      );
  }, [isAnonymous, boardId]);

  const {
    selectedTask,
    parentTask,
    setSelectedTask,
    setParentTask,
    handleTaskClick,
    handleCloseDialog,
    handleSubtaskClick,
  } = useKanbanTaskHandlers({ onTaskOpen, onTaskClose, onSubtaskOpen });

  const isLoading = !isAnonymous && tasksQuery.isPending;

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

  const persistTaskStatus = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const updated = await updateTask(taskId, { status: newStatus });
      if (!updated) toast.error("Can't update task status");
    },
    [updateTask],
  );

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

  const composeMutation = useMutation({
    mutationFn: (text: string) =>
      clientServices.tasks.composeWithAI({
        text,
        taskBoardId: boardId,
      }),
  });

  const handleAICompose = useCallback(
    async (text: string) => {
      if (!boardId) {
        console.error("Cannot compose task: taskBoardId not found");
        return;
      }
      const composedData = await composeMutation.mutateAsync(text);
      if (composedData) {
        setSelectedTask(composedDataToTask(composedData));
      }
    },
    [boardId, composeMutation, setSelectedTask],
  );

  const fetchTasks = useCallback(async () => {
    if (!boardId) return;
    if (isAnonymous) {
      setTasksByStatus(
        tasksToColumns(
          guestTasksForBoard(guestStoreHelper.getTasks(), boardId),
        ),
      );
      return;
    }
    await tasksQuery.refetch();
  }, [boardId, isAnonymous, tasksQuery]);

  const handleTaskCreated = useCallback(
    (createdTask: Task) => {
      void fetchTasks();
      setSelectedTask(createdTask);
    },
    [fetchTasks, setSelectedTask],
  );

  const handleTaskDelete = useCallback(() => {
    void fetchTasks();
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
