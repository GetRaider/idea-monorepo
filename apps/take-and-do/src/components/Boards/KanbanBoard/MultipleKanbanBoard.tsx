"use client";

import { useMutation } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import {
  ChevronRightIcon,
  ClockCircleIcon,
  ClockNavIcon,
} from "@/components/Icons";
import {
  BoardContainer,
  BoardMultiLayout,
  BoardSectionToggle,
  LoadingContainer,
  KanbanSpinner,
  MultiBoardSection,
  MultiBoardColumnsGrid,
  MultiBoardScroller,
  GroupChevronWrapper,
  EmptyStateWrapper,
  BoardTitleEmoji,
} from "./KanbanBoard.ui";
import { Toolbar } from "./shared/Toolbar";
import { KanbanColumns } from "./shared/KanbanColumns";
import { TaskStatus, Task, TaskUpdate } from "./types";
import { handleMultipleBoardsTaskStatusChange } from "./shared/taskStatusHandlers";
import {
  composedDataToTask,
  createNewTaskTemplate,
} from "./shared/taskComposeHelpers";
import { useKanbanTaskHandlers } from "../../../hooks/tasks/useKanbanTaskHandlers";
import { useMultipleKanbanBoardData } from "../../../hooks/tasks/useMultipleKanbanBoardData";
import { useTaskActions } from "@/hooks/tasks/useTasks";
import { useBoardViewMode } from "@/hooks/tasks/useBoardViewMode";
import { useBoardListSubmode } from "@/hooks/tasks/useBoardListSubmode";
import { useBoardListSort } from "@/hooks/tasks/useBoardListSort";
import { TaskView } from "../../TaskView/TaskView";
import { useWorkspace } from "@/contexts";
import {
  applyOptimisticPatch,
  applyOptimisticReparent,
  updateTaskInColumns,
} from "@/hooks/tasks/useTaskBoardState";
import {
  playCompletionChime,
  withSmoothLayout,
} from "@/lib/effects/completion";
import { EmptyState } from "../../EmptyState";
import { TasksWorkspaceEmptyState } from "../../TasksWorkspaceEmptyState";
import { AIComposeDialog } from "./shared/AIComposeDialog";
import { ScheduleBoardPickerDialog } from "./shared/ScheduleBoardPickerDialog";
import { ListBoard } from "../ListBoard";
import { sortTasksForList } from "../ListBoard/listSort";
import {
  QuickCreateTaskRow,
  type QuickCreateTaskInput,
} from "../shared/QuickCreateTaskRow";
import { clientServices } from "@/services";
import { toast } from "sonner";
import type { TaskBoardWithTasks } from "@/types/workspace";
import { tasksUrlHelper, type ScheduleDate } from "@/helpers/tasks-url.helper";
import { tasksHelper } from "@/helpers/task.helper";

export function MultipleKanbanBoard({
  scheduleDate,
  schedule,
  workspaceName,
  folderId,
  onTaskOpen,
  onTaskClose,
  onSubtaskOpen,
}: MultipleKanbanBoardProps) {
  const { createTask, updateTask } = useTaskActions();
  const { taskBoards, isBoardsLoading, openCreateWorkspace } = useWorkspace();
  const {
    boardsWithTasks,
    setBoardsWithTasks,
    isLoading,
    fetchBoards,
    expandedBoardIds,
    toggleBoardExpanded,
  } = useMultipleKanbanBoardData(scheduleDate, folderId);

  const isScheduleDay = schedule === "today" || schedule === "tomorrow";
  const viewModeContextKey = isScheduleDay ? `schedule:${schedule}` : null;
  const [viewMode, setViewMode] = useBoardViewMode(viewModeContextKey);
  const [listSubmode, setListSubmode] = useBoardListSubmode(viewModeContextKey);
  const [listSort, setListSort] = useBoardListSort(viewModeContextKey);

  const [isAIComposeDialogOpen, setIsAIComposeDialogOpen] = useState(false);
  const [selectedBoardIdForAI, setSelectedBoardIdForAI] = useState<
    string | null
  >(null);
  const [boardPickerIntent, setBoardPickerIntent] = useState<
    null | "task" | "ai"
  >(null);

  const {
    selectedTask,
    parentTask,
    setSelectedTask,
    setParentTask,
    handleTaskClick,
    handleCloseDialog,
    handleSubtaskClick,
  } = useKanbanTaskHandlers({ onTaskOpen, onTaskClose, onSubtaskOpen });

  const boardOptions = useMemo(
    () => boardsWithTasks.map((board) => ({ id: board.id, name: board.name })),
    [boardsWithTasks],
  );

  const handleNavigateToParentTask = useCallback(() => {
    if (!parentTask?.taskKey) return;
    if (schedule) {
      tasksUrlHelper.modal.schedule.open(schedule, parentTask);
    }
    setSelectedTask(parentTask);
    setParentTask(null);
  }, [parentTask, schedule, setSelectedTask, setParentTask]);

  const persistTaskStatus = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      const updated = await updateTask(taskId, { status: newStatus });
      if (!updated) toast.error("Can't update task status");
    },
    [updateTask],
  );

  const handleTaskStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus, targetIndex?: number) => {
      const previousStatus = findStatusInBoards(boardsWithTasks, taskId);
      const isCompleting =
        newStatus === TaskStatus.DONE && previousStatus !== TaskStatus.DONE;
      if (isCompleting) playCompletionChime();
      const run = () =>
        handleMultipleBoardsTaskStatusChange(
          boardsWithTasks,
          setBoardsWithTasks,
          taskId,
          newStatus,
          targetIndex,
          persistTaskStatus,
        );
      if (isCompleting) {
        withSmoothLayout(() => {
          void run();
        });
      } else {
        await run();
      }
    },
    [boardsWithTasks, setBoardsWithTasks, persistTaskStatus],
  );

  const handleTaskFieldUpdate = useCallback(
    async (taskId: string, patch: TaskUpdate) => {
      const isReparent = patch.parentTaskId !== undefined;
      const previousStatus = findStatusInBoards(boardsWithTasks, taskId);
      const isCompleting =
        patch.status === TaskStatus.DONE && previousStatus !== TaskStatus.DONE;

      const applyOptimistic = () => {
        if (isReparent) {
          setBoardsWithTasks((prev) =>
            prev.map((board) => ({
              ...board,
              tasks: applyOptimisticReparent(board.tasks, taskId, patch),
            })),
          );
        } else {
          setBoardsWithTasks((prev) =>
            prev.map((board) => ({
              ...board,
              tasks: applyOptimisticPatch(board.tasks, taskId, patch),
            })),
          );
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
        setBoardsWithTasks(await fetchBoards());
        return;
      }
      if (isReparent) {
        void fetchBoards().then(setBoardsWithTasks);
      } else {
        setBoardsWithTasks((prev) =>
          prev.map((board) => ({
            ...board,
            tasks: updateTaskInColumns(board.tasks, updated),
          })),
        );
      }
      if (selectedTask?.id === updated.id) {
        setSelectedTask(updated);
      }
    },
    [
      updateTask,
      setBoardsWithTasks,
      fetchBoards,
      selectedTask,
      setSelectedTask,
      boardsWithTasks,
    ],
  );

  const handleQuickCreate = useCallback(
    async (input: QuickCreateTaskInput) => {
      const board = boardsWithTasks.find(
        (entry) => entry.id === input.taskBoardId,
      );
      const created = await createTask({
        taskBoardId: input.taskBoardId,
        taskBoardName: board?.name,
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
      setBoardsWithTasks(await fetchBoards());
      toast.success(`Task “${created.summary}” created`);
    },
    [createTask, boardsWithTasks, fetchBoards, setBoardsWithTasks],
  );

  const handleTaskUpdate = useCallback(
    async (updatedTask: Task) => {
      const boardRelocated =
        selectedTask?.id === updatedTask.id &&
        selectedTask.taskBoardId !== updatedTask.taskBoardId;
      if (boardRelocated) {
        setBoardsWithTasks(await fetchBoards());
        setSelectedTask(updatedTask);
        return;
      }

      if (scheduleDate) {
        if (!updatedTask.scheduleDate) {
          setBoardsWithTasks(await fetchBoards());
          if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask);
          }
          return;
        }

        const taskDate = tasksHelper.date.parse(updatedTask.scheduleDate);
        if (!taskDate) {
          setBoardsWithTasks(await fetchBoards());
          if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask);
          }
          return;
        }
        taskDate.setHours(0, 0, 0, 0);
        const currentDate = new Date(scheduleDate);
        currentDate.setHours(0, 0, 0, 0);

        const matchesSchedule = taskDate.getTime() === currentDate.getTime();

        if (!matchesSchedule) {
          setBoardsWithTasks(await fetchBoards());
          if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask);
          }
          return;
        }
      }

      setBoardsWithTasks((prev) =>
        prev.map((board) =>
          board.id !== updatedTask.taskBoardId
            ? board
            : {
                ...board,
                tasks: updateTaskInColumns(board.tasks, updatedTask),
              },
        ),
      );
      if (selectedTask?.id === updatedTask.id) setSelectedTask(updatedTask);
    },
    [
      selectedTask,
      setSelectedTask,
      scheduleDate,
      fetchBoards,
      setBoardsWithTasks,
    ],
  );

  const defaultBoardIdForSchedule =
    boardsWithTasks[0]?.id ?? taskBoards[0]?.id ?? null;

  const handleCreateTask = useCallback(() => {
    if (taskBoards.length === 0 || !defaultBoardIdForSchedule) {
      toast.error("Create a board first");
      return;
    }
    if (isScheduleDay) {
      setBoardPickerIntent("task");
      return;
    }
    setSelectedTask(
      createNewTaskTemplate({
        taskBoardId: defaultBoardIdForSchedule,
        scheduleDate: scheduleDate ?? undefined,
      }),
    );
  }, [
    taskBoards.length,
    isScheduleDay,
    defaultBoardIdForSchedule,
    setSelectedTask,
    scheduleDate,
  ]);

  const handleCreateTaskWithAI = useCallback(() => {
    if (taskBoards.length === 0) {
      toast.error("Create a board first");
      return;
    }
    if (isScheduleDay) {
      setBoardPickerIntent("ai");
      return;
    }
    if (!defaultBoardIdForSchedule) {
      toast.error("Create a board first");
      return;
    }
    setSelectedBoardIdForAI(defaultBoardIdForSchedule);
    setIsAIComposeDialogOpen(true);
  }, [taskBoards.length, isScheduleDay, defaultBoardIdForSchedule]);

  const handleScheduleBoardPicked = useCallback(
    (boardId: string) => {
      const intent = boardPickerIntent;
      setBoardPickerIntent(null);
      if (intent === "task") {
        setSelectedTask(
          createNewTaskTemplate({
            taskBoardId: boardId,
            scheduleDate: scheduleDate ?? undefined,
          }),
        );
      } else if (intent === "ai") {
        setSelectedBoardIdForAI(boardId);
        setIsAIComposeDialogOpen(true);
      }
    },
    [boardPickerIntent, scheduleDate, setSelectedTask],
  );

  const composeMutation = useMutation({
    mutationFn: async ({
      text,
      taskBoardId,
      additionalData,
    }: {
      text: string;
      taskBoardId: string;
      additionalData?: Partial<Omit<Task, "id">>;
    }) =>
      clientServices.tasks.composeWithAI({
        text,
        taskBoardId,
        additionalData,
      }),
  });

  const handleAICompose = useCallback(
    async (text: string) => {
      let taskBoardId = selectedBoardIdForAI;
      if (!taskBoardId && defaultBoardIdForSchedule) {
        taskBoardId = defaultBoardIdForSchedule;
      }
      if (!taskBoardId) {
        console.error("Cannot compose task: taskBoardId not found");
        return;
      }
      const additionalData: Partial<Omit<Task, "id">> = scheduleDate
        ? { scheduleDate }
        : {};
      try {
        const composedData = await composeMutation.mutateAsync({
          text,
          taskBoardId,
          additionalData,
        });
        if (composedData) {
          const overrideScheduleDate = scheduleDate ?? undefined;
          setSelectedTask(
            composedDataToTask(composedData, overrideScheduleDate),
          );
          setSelectedBoardIdForAI(null);
        }
      } catch {
        toast.error("Can't compose task with AI");
      }
    },
    [
      composeMutation,
      defaultBoardIdForSchedule,
      scheduleDate,
      selectedBoardIdForAI,
      setSelectedTask,
    ],
  );

  const handleTaskCreated = useCallback(
    async (createdTask: Task) => {
      setBoardsWithTasks(await fetchBoards());
      setSelectedTask(createdTask);
    },
    [fetchBoards, setSelectedTask, setBoardsWithTasks],
  );

  const handleTaskDelete = useCallback(async () => {
    setBoardsWithTasks(await fetchBoards());
    setSelectedTask(null);
  }, [fetchBoards, setSelectedTask, setBoardsWithTasks]);

  return (
    <>
      <BoardContainer>
        <Toolbar
          workspaceTitle={workspaceName}
          workspaceEmoji={
            workspaceName === "Today" ? (
              <ClockNavIcon size={20} />
            ) : workspaceName === "Tomorrow" ? (
              <ClockCircleIcon size={20} />
            ) : (
              (boardsWithTasks[0]?.emoji ?? null)
            )
          }
          onCreateTask={handleCreateTask}
          onCreateTaskWithAI={handleCreateTaskWithAI}
          viewMode={isScheduleDay ? viewMode : undefined}
          onViewModeChange={isScheduleDay ? setViewMode : undefined}
          listSubmode={isScheduleDay ? listSubmode : undefined}
          onListSubmodeChange={isScheduleDay ? setListSubmode : undefined}
          sort={isScheduleDay ? listSort : undefined}
          onSortChange={isScheduleDay ? setListSort : undefined}
        />

        <BoardMultiLayout>
          {!isBoardsLoading && taskBoards.length === 0 ? (
            <EmptyStateWrapper>
              <TasksWorkspaceEmptyState
                onCreateWorkspace={openCreateWorkspace}
              />
            </EmptyStateWrapper>
          ) : isLoading ? (
            <LoadingContainer>
              <KanbanSpinner />
            </LoadingContainer>
          ) : boardsWithTasks.length > 0 ? (
            <>
              <div className="px-4 pb-2">
                <QuickCreateTaskRow
                  boardOptions={boardsWithTasks.map((board) => ({
                    id: board.id,
                    name: board.name,
                    emoji: board.emoji,
                  }))}
                  defaultBoardId={defaultBoardIdForSchedule ?? undefined}
                  defaultScheduleDate={scheduleDate}
                  onCreate={handleQuickCreate}
                />
              </div>
              {boardsWithTasks.map((board) => {
                const isExpanded = expandedBoardIds.has(board.id);
                const sortedTasksByStatus = isScheduleDay
                  ? sortTasksByStatus(board.tasks, listSort)
                  : board.tasks;
                return (
                  <MultiBoardSection key={board.id}>
                    <BoardSectionToggle
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => toggleBoardExpanded(board.id)}
                    >
                      <GroupChevronWrapper isExpanded={isExpanded}>
                        <ChevronRightIcon size={16} />
                      </GroupChevronWrapper>
                      {board.emoji ? (
                        <BoardTitleEmoji aria-hidden>
                          {board.emoji}
                        </BoardTitleEmoji>
                      ) : null}
                      {board.name}
                    </BoardSectionToggle>

                    {isExpanded &&
                      (viewMode === "list" && isScheduleDay ? (
                        <div className="px-4">
                          <ListBoard
                            tasksByStatus={sortedTasksByStatus}
                            submode={listSubmode}
                            onTaskClick={handleTaskClick}
                            onSubtaskClick={handleSubtaskClick}
                            onTaskStatusChange={(
                              taskId,
                              newStatus,
                              targetIndex,
                            ) =>
                              handleTaskStatusChange(
                                taskId,
                                newStatus,
                                targetIndex,
                              )
                            }
                            onTaskFieldUpdate={handleTaskFieldUpdate}
                          />
                        </div>
                      ) : (
                        <MultiBoardScroller>
                          <MultiBoardColumnsGrid>
                            <KanbanColumns
                              tasksByStatus={sortedTasksByStatus}
                              columnBodyScrolls={false}
                              onTaskDrop={handleTaskStatusChange}
                              onTaskClick={handleTaskClick}
                            />
                          </MultiBoardColumnsGrid>
                        </MultiBoardScroller>
                      ))}
                  </MultiBoardSection>
                );
              })}
            </>
          ) : (
            <EmptyStateWrapper>
              <EmptyState
                {...getScheduleEmptyStateCopy(
                  schedule,
                  workspaceName,
                  scheduleDate,
                )}
              />
            </EmptyStateWrapper>
          )}
        </BoardMultiLayout>
      </BoardContainer>
      <TaskView
        task={selectedTask}
        parentTask={parentTask}
        boardName={getTaskWorkspaceTitle(
          selectedTask,
          boardsWithTasks,
          workspaceName,
        )}
        boardOptions={boardOptions}
        onClose={handleCloseDialog}
        onTaskUpdate={handleTaskUpdate}
        onSubtaskClick={handleSubtaskClick}
        onTaskCreated={handleTaskCreated}
        onTaskDelete={handleTaskDelete}
        onNavigateToParentTask={handleNavigateToParentTask}
      />
      <ScheduleBoardPickerDialog
        open={boardPickerIntent !== null}
        boards={taskBoards}
        onClose={() => setBoardPickerIntent(null)}
        onSelect={handleScheduleBoardPicked}
      />
      <AIComposeDialog
        isOpen={isAIComposeDialogOpen}
        onClose={() => {
          setIsAIComposeDialogOpen(false);
          setSelectedBoardIdForAI(null);
        }}
        onCompose={handleAICompose}
      />
    </>
  );
}

function sortTasksByStatus(
  tasksByStatus: Record<TaskStatus, Task[]>,
  sort: Parameters<typeof sortTasksForList>[1],
): Record<TaskStatus, Task[]> {
  return {
    [TaskStatus.TODO]: sortTasksForList(tasksByStatus[TaskStatus.TODO], sort),
    [TaskStatus.IN_PROGRESS]: sortTasksForList(
      tasksByStatus[TaskStatus.IN_PROGRESS],
      sort,
    ),
    [TaskStatus.DONE]: sortTasksForList(tasksByStatus[TaskStatus.DONE], sort),
  };
}

function findStatusInBoards(
  boards: TaskBoardWithTasks[],
  taskId: string,
): TaskStatus | null {
  for (const board of boards) {
    for (const status of Object.values(TaskStatus)) {
      if (board.tasks[status].some((t) => t.id === taskId)) return status;
      for (const t of board.tasks[status]) {
        if (t.subtasks?.some((s) => s.id === taskId)) return t.status;
      }
    }
  }
  return null;
}

function getTaskWorkspaceTitle(
  task: Task | null,
  boardsWithTasks: TaskBoardWithTasks[],
  workspaceName: string,
): string {
  if (!task) return workspaceName;
  const board = boardsWithTasks.find((board) => board.id === task.taskBoardId);
  return board?.name || workspaceName;
}

function getScheduleEmptyStateCopy(
  schedule: ScheduleDate | undefined,
  workspaceName: string,
  scheduleDate: Date | undefined,
): { title: string; message: string } {
  if (schedule === "today" || schedule === "tomorrow") {
    return {
      title: `No tasks scheduled for ${schedule}`,
      message: `When you schedule tasks, they will appear here grouped by board.`,
    };
  }
  if (scheduleDate) {
    return {
      title: "You have no tasks",
      message: `No tasks scheduled for ${scheduleDate.toLocaleDateString()}`,
    };
  }
  return {
    title: "You have no tasks",
    message: `No tasks available for ${workspaceName}`,
  };
}

interface MultipleKanbanBoardProps {
  scheduleDate?: Date;
  schedule?: ScheduleDate;
  workspaceName: string;
  folderId?: string;
  onTaskOpen?: (task: Task) => void;
  onTaskClose?: () => void;
  onSubtaskOpen?: (parentTask: Task, subtask: Task) => void;
}
