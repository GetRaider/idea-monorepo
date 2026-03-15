"use client";

import {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  BoardContainer,
  Board,
  LoadingContainer,
  Spinner,
  EmptyStateWrapper,
} from "./KanbanBoard.styles";
import { Column } from "./Column/Column";
import { Toolbar } from "./shared/Toolbar";
import { TaskStatus, TaskPriority, Task, emptyTaskColumns } from "./types";
import { handleSingleBoardTaskStatusChange } from "./shared/taskStatusHandlers";
import { TaskView } from "../../TaskView/TaskView";
import {
  useTaskBoardState,
  updateTaskInColumns,
} from "@/hooks/useTaskBoardState";
import { EmptyState } from "../../EmptyState";
import { AIComposeModal } from "./shared/AIComposeModal";
import { apiServices } from "@/services/api";

export interface SingleKanbanBoardRef {
  refetch: () => void;
}

interface SingleKanbanBoardProps {
  boardId: string;
  boardName: string;
  workspaceTitle: string;
  onTaskOpen?: (task: Task) => void;
  onTaskClose?: () => void;
  onSubtaskOpen?: (parentTask: Task, subtask: Task) => void;
}

export const SingleKanbanBoard = forwardRef<
  SingleKanbanBoardRef,
  SingleKanbanBoardProps
>(function SingleKanbanBoard(
  {
    boardId,
    boardName,
    workspaceTitle,
    onTaskOpen,
    onTaskClose,
    onSubtaskOpen,
  },
  ref,
) {
  const [tasksByStatus, setTasksByStatus] =
    useState<Record<TaskStatus, Task[]>>(emptyTaskColumns);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIComposeModalOpen, setIsAIComposeModalOpen] = useState(false);

  const {
    selectedTask,
    parentTask,
    setSelectedTask,
    handleTaskClick: baseHandleTaskClick,
    handleCloseModal: baseHandleCloseModal,
    handleSubtaskClick: baseHandleSubtaskClick,
  } = useTaskBoardState();

  const handleTaskClick = (task: Task) => {
    baseHandleTaskClick(task);
    onTaskOpen?.(task);
  };

  const handleCloseModal = () => {
    baseHandleCloseModal();
    onTaskClose?.();
  };

  const handleSubtaskClick = (subtask: Task) => {
    if (selectedTask) {
      onSubtaskOpen?.(selectedTask, subtask);
    }
    baseHandleSubtaskClick(subtask);
  };

  const fetchTasks = useCallback(async () => {
    if (!boardId) return;
    setIsLoading(true);
    try {
      const tasks = await apiServices.tasks.getByBoardId(boardId);
      const tasksByStatusMap: Record<TaskStatus, Task[]> = {
        [TaskStatus.TODO]: [],
        [TaskStatus.IN_PROGRESS]: [],
        [TaskStatus.DONE]: [],
      };
      tasks.forEach((task) => {
        tasksByStatusMap[task.status].push(task);
      });
      setTasksByStatus(tasksByStatusMap);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasksByStatus(emptyTaskColumns);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useImperativeHandle(ref, () => ({ refetch: fetchTasks }), [fetchTasks]);

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
    const newTaskTemplate: Task = {
      id: "",
      taskBoardId: boardId,
      summary: "",
      description: "",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    };
    setSelectedTask(newTaskTemplate);
  }, [boardId]);

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

        // Convert to Task format (without id, ready for editing)
        const composedTask: Task = {
          id: "", // Will be generated when saved
          taskBoardId: composedData.taskBoardId,
          taskKey: composedData.taskKey,
          summary: composedData.summary,
          description: composedData.description,
          status: (composedData.status as TaskStatus) || TaskStatus.TODO,
          priority:
            (composedData.priority as TaskPriority) || TaskPriority.MEDIUM,
          labels: composedData.labels,
          dueDate: composedData.dueDate,
          estimation: composedData.estimation,
          scheduleDate: composedData.scheduleDate,
          subtasks: composedData.subtasks,
        };

        setSelectedTask(composedTask);
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
          onCreateTask={handleCreateTask}
          onCreateTaskWithAI={handleCreateTaskWithAI}
        />

        <Board>
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
});

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
        title="You have no tasks"
        message={`No tasks in ${workspaceTitle}`}
      />
    </EmptyStateWrapper>
  ) : (
    <>
      <Column
        status={TaskStatus.TODO}
        tasks={tasksByStatus[TaskStatus.TODO]}
        onTaskDrop={handleTaskStatusChange}
        onTaskClick={handleTaskClick}
      />
      <Column
        status={TaskStatus.IN_PROGRESS}
        tasks={tasksByStatus[TaskStatus.IN_PROGRESS]}
        onTaskDrop={handleTaskStatusChange}
        onTaskClick={handleTaskClick}
      />
      <Column
        status={TaskStatus.DONE}
        tasks={tasksByStatus[TaskStatus.DONE]}
        onTaskDrop={handleTaskStatusChange}
        onTaskClick={handleTaskClick}
      />
    </>
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
