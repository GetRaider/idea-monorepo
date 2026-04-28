"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  type ReactNode,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  BoardContainer,
  Board,
  LoadingContainer,
  KanbanSpinner,
} from "./KanbanBoard.ui";
import { Toolbar } from "./shared/Toolbar";
import { KanbanColumns } from "./shared/KanbanColumns";
import { TaskStatus, Task, TaskUpdate, emptyTaskColumns } from "./types";
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
  applyOptimisticPatch,
  applyOptimisticReparent,
  removeTaskFromColumns,
  updateTaskInColumns,
} from "@/hooks/tasks/useTaskBoardState";
import {
  playCompletionChime,
  withSmoothLayout,
} from "@/lib/effects/completion";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { BoardTasksEmptyState } from "../shared/BoardTasksEmptyState";
import { AIComposeDialog } from "./shared/AIComposeDialog";
import { ListBoard } from "../ListBoard";
import { sortTasksForList } from "../ListBoard/listSort";
import {
  QuickCreateTaskRow,
  type QuickCreateTaskInput,
} from "../shared/QuickCreateTaskRow";
import { useBoardViewMode } from "@/hooks/tasks/useBoardViewMode";
import {
  useBoardListSubmode,
  type BoardListSubmode,
} from "@/hooks/tasks/useBoardListSubmode";
import { useBoardListSort } from "@/hooks/tasks/useBoardListSort";
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
  const { createTask, updateTask } = useTaskActions();
  const { taskBoards } = useWorkspace();
  const [viewMode, setViewMode] = useBoardViewMode(boardId);
  const [listSubmode, setListSubmode] = useBoardListSubmode(boardId);
  const [listSort, setListSort] = useBoardListSort(boardId);
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

  const persistTaskStatus = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const updated = await updateTask(taskId, { status: newStatus });
      if (!updated) toast.error("Can't update task status");
    },
    [updateTask],
  );

  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus, targetIndex?: number) => {
      const previousStatus = findStatusOfTask(tasksByStatus, taskId);
      const isCompleting =
        newStatus === TaskStatus.DONE && previousStatus !== TaskStatus.DONE;
      if (isCompleting) playCompletionChime();
      const run = () =>
        handleSingleBoardTaskStatusChange(
          tasksByStatus,
          setTasksByStatus,
          taskId,
          newStatus,
          targetIndex,
          persistTaskStatus,
        );
      if (isCompleting) {
        // The View Transitions API cleanly cross-fades the card between
        // columns; falls back to a normal call when unsupported.
        withSmoothLayout(() => {
          void run();
        });
      } else {
        await run();
      }
    },
    [tasksByStatus, persistTaskStatus],
  );

  const handleTaskFieldUpdate = useCallback(
    async (taskId: string, patch: TaskUpdate) => {
      const isReparent = patch.parentTaskId !== undefined;
      // Was-not-done → done: trigger the completion flourish (chime + smooth
      // view transition). Anything else just patches in place.
      const previousStatus = findStatusOfTask(tasksByStatus, taskId);
      const isCompleting =
        patch.status === TaskStatus.DONE && previousStatus !== TaskStatus.DONE;

      // Optimistic local update so the row reflects the change immediately.
      const applyOptimistic = () => {
        if (isReparent) {
          setTasksByStatus((prev) =>
            applyOptimisticReparent(prev, taskId, patch),
          );
        } else {
          setTasksByStatus((prev) => applyOptimisticPatch(prev, taskId, patch));
        }
      };
      if (isCompleting) {
        playCompletionChime();
        withSmoothLayout(applyOptimistic);
      } else {
        applyOptimistic();
      }

      const updated = await updateTask(taskId, patch);
      if (!updated) {
        toast.error("Can't update task");
        // Refetch to roll back any optimistic change that the server rejected.
        void fetchTasks();
        return;
      }
      if (isReparent) {
        // Re-parenting may re-key/re-board the task; refetch to reconcile.
        void fetchTasks();
      } else {
        setTasksByStatus((prev) => updateTaskInColumns(prev, updated));
      }
      if (selectedTask?.id === updated.id) {
        setSelectedTask(updated);
      }
    },
    [updateTask, selectedTask, setSelectedTask, fetchTasks, tasksByStatus],
  );

  const handleQuickCreate = useCallback(
    async (input: QuickCreateTaskInput) => {
      const created = await createTask({
        taskBoardId: input.taskBoardId,
        taskBoardName: boardName,
        summary: input.summary,
        description: "",
        status: input.status,
        priority: input.priority,
        ...(input.scheduleDate && { scheduleDate: input.scheduleDate }),
        ...(input.dueDate && { dueDate: input.dueDate }),
        ...(input.estimation != null && { estimation: input.estimation }),
      });
      if (!created) {
        toast.error("Can't create task");
        return;
      }
      setTasksByStatus((prev) => ({
        ...prev,
        [created.status]: [...prev[created.status], created],
      }));
      toast.success(`Task “${created.summary}” created`);
    },
    [createTask, boardName],
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
      try {
        const composedData = await composeMutation.mutateAsync(text);
        if (composedData) {
          setSelectedTask(composedDataToTask(composedData));
        }
      } catch {
        toast.error("Can't compose task with AI");
      }
    },
    [boardId, composeMutation, setSelectedTask],
  );

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

  const sortedTasksByStatus = useMemo<Record<TaskStatus, Task[]>>(
    () => ({
      [TaskStatus.TODO]: sortTasksForList(
        tasksByStatus[TaskStatus.TODO],
        listSort,
      ),
      [TaskStatus.IN_PROGRESS]: sortTasksForList(
        tasksByStatus[TaskStatus.IN_PROGRESS],
        listSort,
      ),
      [TaskStatus.DONE]: sortTasksForList(
        tasksByStatus[TaskStatus.DONE],
        listSort,
      ),
    }),
    [tasksByStatus, listSort],
  );

  return (
    <>
      <BoardContainer>
        <Toolbar
          workspaceTitle={boardName}
          workspaceEmoji={boardEmoji}
          onCreateTask={handleCreateTask}
          onCreateTaskWithAI={handleCreateTaskWithAI}
          boardId={boardId}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          listSubmode={listSubmode}
          onListSubmodeChange={setListSubmode}
          sort={listSort}
          onSortChange={setListSort}
        />

        <Board fillHeight={viewMode === "kanban"} viewMode={viewMode}>
          {isLoading ? (
            <LoadingContainer>
              <KanbanSpinner />
            </LoadingContainer>
          ) : (
            <BoardContent
              totalTasksLength={totalTasksLength}
              tasksByStatus={sortedTasksByStatus}
              viewMode={viewMode}
              listSubmode={listSubmode}
              handleTaskStatusChange={handleTaskStatusChange}
              handleTaskClick={handleTaskClick}
              handleSubtaskClick={handleSubtaskClick}
              handleTaskFieldUpdate={handleTaskFieldUpdate}
              boardName={boardName}
              quickCreateRow={
                <QuickCreateTaskRow
                  taskBoardId={boardId}
                  onCreate={handleQuickCreate}
                  triggerLabel={
                    totalTasksLength === 0 ? "Add your first task" : undefined
                  }
                />
              }
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
  viewMode,
  listSubmode,
  handleTaskStatusChange,
  handleTaskClick,
  handleSubtaskClick,
  handleTaskFieldUpdate,
  boardName,
  quickCreateRow,
}: BoardContentProps) {
  if (totalTasksLength === 0) {
    return (
      <BoardTasksEmptyState
        boardName={boardName}
        quickCreateSlot={quickCreateRow}
      />
    );
  }

  if (viewMode === "list") {
    return (
      <ListBoard
        tasksByStatus={tasksByStatus}
        submode={listSubmode}
        topSlot={quickCreateRow}
        onTaskClick={handleTaskClick}
        onSubtaskClick={handleSubtaskClick}
        onTaskStatusChange={(taskId, newStatus) =>
          handleTaskStatusChange(taskId, newStatus)
        }
        onTaskFieldUpdate={handleTaskFieldUpdate}
      />
    );
  }

  return (
    <KanbanColumns
      tasksByStatus={tasksByStatus}
      todoTopSlot={quickCreateRow}
      onTaskDrop={handleTaskStatusChange}
      onTaskClick={handleTaskClick}
    />
  );
}

interface BoardContentProps {
  totalTasksLength: number;
  tasksByStatus: Record<TaskStatus, Task[]>;
  viewMode: "kanban" | "list";
  listSubmode: BoardListSubmode;
  handleTaskStatusChange: (
    taskId: string,
    newStatus: TaskStatus,
    targetIndex?: number,
  ) => void;
  handleTaskClick: (task: Task) => void;
  handleSubtaskClick: (subtask: Task) => void;
  handleTaskFieldUpdate: (taskId: string, patch: TaskUpdate) => void;
  boardName: string;
  quickCreateRow?: ReactNode;
}

function findStatusOfTask(
  tasksByStatus: Record<TaskStatus, Task[]>,
  taskId: string,
): TaskStatus | null {
  for (const status of Object.values(TaskStatus)) {
    if (tasksByStatus[status].some((t) => t.id === taskId)) return status;
    for (const t of tasksByStatus[status]) {
      if (t.subtasks?.some((s) => s.id === taskId)) return t.status;
    }
  }
  return null;
}
