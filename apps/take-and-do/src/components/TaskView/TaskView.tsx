"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  TaskSaveButton,
} from "./TaskView.ui";
import { TaskMetadata } from "./TaskMetadata/TaskMetadata";
import { TaskSubtasks } from "./TaskSubtasks/TaskSubtasks";
import { TaskViewSidebar } from "./TaskViewSidebar/TaskViewSidebar";

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
  const [isSaving, setIsSaving] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Partial<Task>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const shouldCreateTask = useMemo(
    () => isCreating && !task?.id,
    [isCreating, task?.id],
  );

  useEffect(() => {
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
    setPendingUpdates({});
  }, [initialTask]);

  const handleUpdateTask = useCallback(
    async (updates: TaskUpdate) => {
      if (!task || !task.id) return;
      const updatedTask = await updateTask(task.id, updates);
      if (!updatedTask) {
        toast.error("Can't update task");
        return;
      }
      setTask(updatedTask);
      onTaskUpdate?.(updatedTask);
      setPendingUpdates({});
      setTitleValue(updatedTask.summary);
      setDescriptionValue(
        normalizeDescriptionHtml(updatedTask.description || ""),
      );
      toast.success("Task updated");
    },
    [task, onTaskUpdate, updateTask],
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!initialTask || !initialTask.id) return false;
    return (
      titleValue !== initialTask.summary ||
      normalizeDescriptionHtml(descriptionValue) !==
        normalizeDescriptionHtml(initialTask.description || "") ||
      Object.keys(pendingUpdates).length > 0
    );
  }, [initialTask, titleValue, descriptionValue, pendingUpdates]);

  const handleSaveChanges = useCallback(async () => {
    if (!initialTask || !initialTask.id || isSaving || !hasUnsavedChanges)
      return;

    const updates: TaskUpdate = {};

    if (titleValue !== initialTask.summary) {
      updates.summary = titleValue;
    }
    const nextDesc = normalizeDescriptionHtml(descriptionValue);
    const initialDesc = normalizeDescriptionHtml(initialTask.description || "");
    if (nextDesc !== initialDesc) {
      updates.description = nextDesc;
    }

    const allUpdates = { ...pendingUpdates, ...updates };

    if (Object.keys(allUpdates).length === 0) return;

    setIsSaving(true);
    try {
      await handleUpdateTask(allUpdates);
    } finally {
      setIsSaving(false);
    }
  }, [
    initialTask,
    titleValue,
    descriptionValue,
    pendingUpdates,
    isSaving,
    hasUnsavedChanges,
    handleUpdateTask,
  ]);

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

  const handleDescriptionBlur = useCallback(() => {
    setDescriptionValue((prev) => normalizeDescriptionHtml(prev));
    setIsEditingDescription(false);
  }, []);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (initialTask) {
      setTask(initialTask);
      setTitleValue(initialTask.summary);
      setDescriptionValue(
        normalizeDescriptionHtml(initialTask.description || ""),
      );
      setPendingUpdates({});
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    }
    onClose();
  };

  const handleTitleClick = () => setIsEditingTitle(true);
  const handleTitleBlur = () => setIsEditingTitle(false);

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      if (isCreating) {
        onClose();
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
      setPendingUpdates((prev) => ({ ...prev, status }));
      setTask((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handlePrioritySelect = (priority: TaskPriority) => {
    if (shouldCreateTask) {
      if (task) setTask({ ...task, priority });
    } else {
      setPendingUpdates((prev) => ({ ...prev, priority }));
      setTask((prev) => (prev ? { ...prev, priority } : null));
    }
  };

  const handleBoardSelect = (boardId: string) => {
    if (shouldCreateTask) {
      if (task) setTask({ ...task, taskBoardId: boardId });
    } else {
      setPendingUpdates((prev) => ({ ...prev, taskBoardId: boardId }));
      setTask((prev) => (prev ? { ...prev, taskBoardId: boardId } : null));
    }
  };

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
    onClose();
    toast.success("Task deleted");
  }, [task, isCreating, onTaskDelete, onClose, deleteTask]);

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
          onClose={onClose}
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
                  placeholder="Enter task summary..."
                />
              ) : (
                <TaskTitle onClick={handleTitleClick}>
                  {titleValue || displayTask.summary || "Untitled Task"}
                </TaskTitle>
              )}
            </TaskTitleSection>

            {isEditingDescription ? (
              <TextEditor
                content={descriptionValue}
                editable={isEditingDescription}
                placeholder="No description"
                onUpdate={handleDescriptionUpdate}
                onBlur={handleDescriptionBlur}
              />
            ) : (
              <TaskDescriptionMarkdown onClick={handleDescriptionClick}>
                {!isDescriptionHtmlEmpty(
                  descriptionValue || task.description || "",
                ) ? (
                  <DescriptionContent
                    dangerouslySetInnerHTML={{
                      __html: descriptionValue || task.description || "",
                    }}
                  />
                ) : (
                  <NoDescriptionText>No description</NoDescriptionText>
                )}
              </TaskDescriptionMarkdown>
            )}

            <div className="min-h-3 flex-1" />

            {!isSubtask && displayTask.id && (
              <div className="mt-8 shrink-0">
                <TaskSubtasks
                  task={displayTask}
                  onSubtaskClick={onSubtaskClick}
                  onTaskUpdate={handleTaskUpdateFromSubtasks}
                />
              </div>
            )}
          </TaskViewLeftPanel>

          <TaskViewRightPanel>
            {isCreating ? (
              <TaskMetadata
                task={displayTask}
                initialTask={initialTask}
                isCreating={isCreating}
                onTaskChange={setTask}
                onPendingMetadataUpdates={(updates) =>
                  setPendingUpdates((prev) => ({ ...prev, ...updates }))
                }
              />
            ) : (
              <TaskViewSidebar
                task={displayTask}
                initialTask={initialTask}
                isCreating={isCreating}
                onTaskChange={setTask}
                onPendingMetadataUpdates={(updates) =>
                  setPendingUpdates((prev) => ({ ...prev, ...updates }))
                }
                onStatusSelect={handleStatusSelect}
                onPrioritySelect={handlePrioritySelect}
              />
            )}
          </TaskViewRightPanel>
        </TaskViewBody>

        <TaskViewFooter>
          <div />
          <FooterActions>
            {isCreating ? (
              <>
                <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                <CreateTaskButton
                  onClick={handleCreateTask}
                  disabled={!titleValue.trim() || isCreatingTask}
                  inactive={!titleValue.trim() || isCreatingTask}
                >
                  {isCreatingTask ? "Creating..." : "Create"}
                </CreateTaskButton>
              </>
            ) : (
              <>
                <SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
                <TaskSaveButton
                  onClick={handleSaveChanges}
                  disabled={isSaving || !hasUnsavedChanges}
                  inactive={isSaving || !hasUnsavedChanges}
                >
                  {isSaving ? "Saving..." : "Save"}
                </TaskSaveButton>
              </>
            )}
          </FooterActions>
        </TaskViewFooter>
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
