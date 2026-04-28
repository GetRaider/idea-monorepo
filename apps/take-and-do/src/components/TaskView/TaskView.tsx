"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskUpdate,
} from "../Boards/KanbanBoard/types";
import { toast } from "sonner";
import { useTaskActions } from "@/hooks/tasks/useTasks";
import { TextEditor } from "../TextEditor/TextEditor";
import { TaskViewHeader } from "./TaskViewHeader/TaskViewHeader";
import { SecondaryButton } from "@/components/Buttons";
import { ConfirmDialog } from "@/components/Dialogs";
import {
  TaskViewOverlay,
  TaskViewContainer,
  TaskViewBody,
  TaskViewLeftPanel,
  TaskViewRightPanel,
  TaskTitleSection,
  TaskTitle,
  TaskTitleInput,
  TaskDescriptionMarkdown,
  DescriptionContent,
  NoDescriptionText,
  TaskViewFooter,
  FooterActions,
  CreateTaskButton,
} from "./TaskView.ui";
import { TaskSubtasks } from "./TaskSubtasks/TaskSubtasks";
import { TaskViewSidebar } from "./TaskViewSidebar/TaskViewSidebar";

const DESCRIPTION_PLACEHOLDER = "No description yet — type / for formatting";

/** TipTap / rich HTML with no visible text (e.g. `<p></p>`) should behave like empty. */
function isDescriptionHtmlEmpty(html: string): boolean {
  if (!html?.trim()) return true;
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u200b/g, "")
    .trim();
  return text.length === 0;
}

function normalizeDescriptionHtml(html: string): string {
  return isDescriptionHtmlEmpty(html) ? "" : html;
}

export function TaskView({
  task: initialTask,
  parentTask,
  boardName,
  boardOptions,
  onClose,
  onTaskUpdate,
  onSubtaskClick,
  onTaskCreated,
  onTaskDelete,
  onNavigateToParentTask,
}: TaskViewProps) {
  const { createTask, updateTask, deleteTask } = useTaskActions();
  const isSubtask = !!parentTask;
  const [task, setTask] = useState<Task | null>(initialTask);
  const isCreating = !initialTask || !initialTask.id;
  const [isEditingTitle, setIsEditingTitle] = useState(isCreating);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isClosingRef = useRef(false);

  const shouldCreateTask = useMemo(
    () => isCreating && !task?.id,
    [isCreating, task?.id],
  );

  useEffect(() => {
    if (initialTask) {
      isClosingRef.current = false;
    }
    setTask(initialTask);
    if (initialTask) {
      setTitleValue(initialTask.summary);
      setDescriptionValue(
        normalizeDescriptionHtml(initialTask.description || ""),
      );
    } else {
      setTitleValue("");
      setDescriptionValue("");
    }
  }, [initialTask]);

  const handleUpdateTask = useCallback(
    async (updates: TaskUpdate) => {
      if (!task || !task.id) return;
      const updatedTask = await updateTask(task.id, updates);
      if (!updatedTask) {
        toast.error("Can't update task");
        return;
      }
      if (isClosingRef.current) {
        toast.success("Task updated");
        return;
      }
      setTask(updatedTask);
      onTaskUpdate?.(updatedTask);
      if ("summary" in updates) {
        setTitleValue(updatedTask.summary);
      }
      if ("description" in updates) {
        setDescriptionValue(
          normalizeDescriptionHtml(updatedTask.description || ""),
        );
      }
      toast.success("Task updated");
    },
    [task, onTaskUpdate, updateTask],
  );

  const handleClose = useCallback(() => {
    isClosingRef.current = true;
    onClose();
  }, [onClose]);

  const handleTaskUpdateFromSubtasks = useCallback(
    (updatedTask: Task) => {
      setTask(updatedTask);
      onTaskUpdate?.(updatedTask);
    },
    [onTaskUpdate],
  );

  const handleDescriptionUpdate = useCallback((html: string) => {
    setDescriptionValue(html);
  }, []);

  const handleDescriptionBlur = useCallback(async () => {
    const nextDescription = normalizeDescriptionHtml(descriptionValue);
    setDescriptionValue(nextDescription);
    setIsEditingDescription(false);
    if (shouldCreateTask) return;
    if (nextDescription === normalizeDescriptionHtml(task?.description || "")) {
      return;
    }
    await handleUpdateTask({ description: nextDescription });
  }, [descriptionValue, handleUpdateTask, shouldCreateTask, task?.description]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleTitleClick = () => setIsEditingTitle(true);
  const handleTitleBlur = async () => {
    // While creating a brand-new task, keep the input visible so the placeholder
    // ("Untitled Task") communicates intent instead of falling back to static text.
    if (!isCreating) {
      setIsEditingTitle(false);
    }
    const nextTitle = titleValue.trim();
    if (shouldCreateTask || !nextTitle || nextTitle === task?.summary) return;
    await handleUpdateTask({ summary: nextTitle });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      if (isCreating) {
        handleClose();
      } else {
        setTitleValue(task?.summary || "");
        setIsEditingTitle(false);
      }
    }
  };

  const handleDescriptionClick = () => setIsEditingDescription(true);

  const handleStatusSelect = (status: TaskStatus) => {
    if (shouldCreateTask) {
      if (task) setTask({ ...task, status });
    } else {
      if (!task || status === task.status) return;
      void handleUpdateTask({ status });
    }
  };

  const handlePrioritySelect = (priority: TaskPriority) => {
    if (shouldCreateTask) {
      if (task) setTask({ ...task, priority });
    } else {
      if (!task || priority === task.priority) return;
      void handleUpdateTask({ priority });
    }
  };

  const handleBoardSelect = (boardId: string) => {
    if (shouldCreateTask) {
      if (task) setTask({ ...task, taskBoardId: boardId });
    } else {
      if (!task || boardId === task.taskBoardId) return;
      void handleUpdateTask({ taskBoardId: boardId });
    }
  };

  const handleMetadataAutoSave = useCallback(
    (updates: TaskUpdate) => {
      if (shouldCreateTask) return;
      void handleUpdateTask(updates);
    },
    [handleUpdateTask, shouldCreateTask],
  );

  const handleCreateTask = async () => {
    if (!task || !titleValue.trim() || isCreatingTask || !task.taskBoardId)
      return;

    setIsCreatingTask(true);
    try {
      const taskBoardName =
        boardOptions.find((board) => board.id === task.taskBoardId)?.name ??
        boardName;
      const taskData: Omit<Task, "id"> & { taskBoardName?: string } = {
        taskBoardId: task.taskBoardId,
        summary: titleValue.trim(),
        description: normalizeDescriptionHtml(descriptionValue),
        status: task.status || TaskStatus.TODO,
        priority: task.priority || TaskPriority.MEDIUM,
        labels: task.labels,
        dueDate: task.dueDate,
        estimation: task.estimation,
        scheduleDate: task.scheduleDate,
        subtasks: task.subtasks,
        taskBoardName: taskBoardName.trim() || undefined,
      };

      const createdTask = await createTask(taskData);
      if (!createdTask) {
        toast.error("Can't create task");
        return;
      }
      setTask(createdTask);
      onTaskCreated?.(createdTask);
      setIsEditingTitle(false);
      toast.success("Task created");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!task || !task.id || isCreating) return;
    await deleteTask(task.id);
    onTaskDelete?.(task.id);
    handleClose();
    toast.success("Task deleted");
  }, [task, isCreating, onTaskDelete, handleClose, deleteTask]);

  const handleDeleteClick = useCallback(() => {
    if (!task || !task.id || isCreating) return;
    setShowDeleteConfirm(true);
  }, [task, isCreating]);

  const handleDuplicate = useCallback(async () => {
    if (!task || !task.id || isCreating) return;
    const duplicated = await createTask({
      taskBoardId: task.taskBoardId,
      summary: `${task.summary} (Copy)`,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      labels: task.labels,
      dueDate: task.dueDate,
      estimation: task.estimation,
      scheduleDate: task.scheduleDate,
    });
    if (duplicated) onTaskCreated?.(duplicated);
    toast.success("Task duplicated");
  }, [task, isCreating, createTask, onTaskCreated]);

  const boardDisplayName = useMemo(() => {
    if (!task) return boardName;
    const fromOptions = boardOptions.find(
      (b) => b.id === task.taskBoardId,
    )?.name;
    return fromOptions ?? boardName;
  }, [boardOptions, boardName, task]);

  const boardPickerDisabled =
    boardOptions.length === 0 || (isCreating && !!task && !task.taskBoardId);

  if (!task) return null;

  const displayTask = task;

  return (
    <TaskViewOverlay onClick={handleOverlayClick}>
      <TaskViewContainer
        data-task-view-container=""
        onClick={(e) => e.stopPropagation()}
      >
        <TaskViewHeader
          boardDisplayName={boardDisplayName}
          boardOptions={boardOptions}
          onBoardSelect={handleBoardSelect}
          boardPickerDisabled={boardPickerDisabled}
          task={displayTask}
          parentTask={parentTask}
          onNavigateToParentTask={onNavigateToParentTask}
          onClose={handleClose}
          onDelete={!isCreating ? handleDeleteClick : undefined}
          onDuplicate={!isCreating ? handleDuplicate : undefined}
          isCreating={isCreating}
        />

        <TaskViewBody>
          <TaskViewLeftPanel>
            <TaskTitleSection>
              {isEditingTitle ? (
                <TaskTitleInput
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  placeholder={
                    isCreating ? "Untitled Task" : "Enter task summary..."
                  }
                />
              ) : (
                <TaskTitle onClick={handleTitleClick}>
                  {titleValue || displayTask.summary}
                </TaskTitle>
              )}
            </TaskTitleSection>

            {isEditingDescription ? (
              <TextEditor
                className="min-h-[260px] flex-1"
                content={descriptionValue}
                editable={isEditingDescription}
                placeholder={DESCRIPTION_PLACEHOLDER}
                onUpdate={handleDescriptionUpdate}
                onBlur={handleDescriptionBlur}
              />
            ) : (
              <TaskDescriptionMarkdown
                className="min-h-[260px] flex-1"
                onClick={handleDescriptionClick}
              >
                {!isDescriptionHtmlEmpty(
                  descriptionValue || task.description || "",
                ) ? (
                  <DescriptionContent
                    dangerouslySetInnerHTML={{
                      __html: descriptionValue || task.description || "",
                    }}
                  />
                ) : (
                  <NoDescriptionText>
                    {DESCRIPTION_PLACEHOLDER}
                  </NoDescriptionText>
                )}
              </TaskDescriptionMarkdown>
            )}

            {!isSubtask && displayTask.id && (
              <div className="mt-6 shrink-0">
                <TaskSubtasks
                  task={displayTask}
                  onSubtaskClick={onSubtaskClick}
                  onTaskUpdate={handleTaskUpdateFromSubtasks}
                />
              </div>
            )}
          </TaskViewLeftPanel>

          <TaskViewRightPanel>
            <TaskViewSidebar
              task={displayTask}
              initialTask={initialTask}
              isCreating={isCreating}
              onTaskChange={setTask}
              onPendingMetadataUpdates={handleMetadataAutoSave}
              onStatusSelect={handleStatusSelect}
              onPrioritySelect={handlePrioritySelect}
            />
          </TaskViewRightPanel>
        </TaskViewBody>

        {isCreating && (
          <TaskViewFooter>
            <div />
            <FooterActions>
              <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
              <CreateTaskButton
                onClick={handleCreateTask}
                disabled={!titleValue.trim() || isCreatingTask}
                inactive={!titleValue.trim() || isCreatingTask}
              >
                {isCreatingTask ? "Creating..." : "Create"}
              </CreateTaskButton>
            </FooterActions>
          </TaskViewFooter>
        )}
      </TaskViewContainer>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete task?"
          description="This will permanently delete this task. This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </TaskViewOverlay>
  );
}

interface TaskBoardOption {
  id: string;
  name: string;
}

interface TaskViewProps {
  task: Task | null;
  parentTask?: Task | null;
  boardName: string;
  boardOptions: TaskBoardOption[];
  onClose: () => void;
  onTaskUpdate?: (updatedTask: Task) => void;
  onSubtaskClick?: (subtask: Task) => void;
  onTaskCreated?: (createdTask: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onNavigateToParentTask?: () => void;
}
