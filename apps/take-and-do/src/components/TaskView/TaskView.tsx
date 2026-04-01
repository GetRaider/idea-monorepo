"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskUpdate,
} from "../Boards/KanbanBoard/types";
import { toast } from "sonner";
import { useTaskActions } from "@/hooks/useTasks";
import { TextEditor } from "../TextEditor/TextEditor";
import { tasksHelper } from "@/helpers/task.helper";
import { TaskViewHeader } from "./TaskViewHeader/TaskViewHeader";
import { SecondaryButton } from "@/components/Buttons";
import { ConfirmDialog } from "@/components/Dialogs";
import {
  TaskViewOverlay,
  TaskViewContainer,
  TaskTitleSection,
  PriorityIcon,
  TaskTitle,
  TaskTitleInput,
  TaskDescriptionMarkdown,
  DropdownContainer,
  DropdownItem,
  PriorityDropdownWrapper,
  PriorityIconSpan,
  DescriptionContent,
  NoDescriptionText,
  TaskViewFooter,
  CreateTaskButton,
  TaskSaveButton,
} from "./TaskView.ui";
import { TaskMetadata } from "./TaskMetadata/TaskMetadata";
import { TaskSubtasks } from "./TaskSubtasks/TaskSubtasks";
import { useClickOutside } from "@/hooks/useClickOutside";

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
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Partial<Task>>({});

  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const shouldCreateTask = useMemo(
    () => isCreating && !task?.id,
    [isCreating, task?.id],
  );

  useEffect(() => {
    setTask(initialTask);
    if (initialTask) {
      setTitleValue(initialTask.summary);
      setDescriptionValue(initialTask.description || "");
    } else {
      setTitleValue("");
      setDescriptionValue("");
    }
    setPendingUpdates({});
  }, [initialTask]);

  const closePriorityDropdown = useCallback(
    () => setIsPriorityDropdownOpen(false),
    [],
  );
  useClickOutside(
    priorityDropdownRef,
    isPriorityDropdownOpen,
    closePriorityDropdown,
  );

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
      setDescriptionValue(updatedTask.description || "");
      toast.success("Task updated");
    },
    [task, onTaskUpdate, updateTask],
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!initialTask || !initialTask.id) return false;
    return (
      titleValue !== initialTask.summary ||
      descriptionValue !== (initialTask.description || "") ||
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
    if (descriptionValue !== (initialTask.description || "")) {
      updates.description = descriptionValue;
    }

    // Merge pending updates from metadata
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
      setDescriptionValue(initialTask.description || "");
      setPendingUpdates({});
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    }
    onClose();
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (shouldCreateTask) {
        // In create mode, Enter just blurs (user must click save)
        e.currentTarget.blur();
      } else {
        e.currentTarget.blur();
      }
    } else if (e.key === "Escape") {
      if (isCreating) {
        onClose();
      } else {
        setTitleValue(task?.summary || "");
        setIsEditingTitle(false);
      }
    }
  };

  const handleDescriptionClick = () => {
    setIsEditingDescription(true);
  };

  const handlePriorityClick = () => {
    setIsPriorityDropdownOpen(!isPriorityDropdownOpen);
  };

  const handlePrioritySelect = (priority: TaskPriority) => {
    setIsPriorityDropdownOpen(false);
    if (shouldCreateTask) {
      if (task) setTask({ ...task, priority });
    } else {
      setPendingUpdates((prev) => ({ ...prev, priority }));
      setTask((prev) => (prev ? { ...prev, priority } : null));
    }
  };

  const handleStatusSelect = (status: TaskStatus) => {
    if (shouldCreateTask) {
      if (task) setTask({ ...task, status });
    } else {
      setPendingUpdates((prev) => ({ ...prev, status }));
      setTask((prev) => (prev ? { ...prev, status } : null));
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
        description: descriptionValue || "",
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const boardDisplayName = useMemo(() => {
    if (!task) return boardName;
    const fromOptions = boardOptions.find(
      (b) => b.id === task.taskBoardId,
    )?.name;
    return fromOptions ?? boardName;
  }, [boardOptions, boardName, task]);

  const boardPickerDisabled =
    boardOptions.length === 0 || (isCreating && !!task && !task.taskBoardId);

  // Only render if we have a task (either existing or for creation)
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
          onStatusSelect={handleStatusSelect}
          onClose={onClose}
          onDelete={handleDeleteClick}
          isCreating={isCreating}
        />
        <TaskTitleSection>
          <PriorityDropdownWrapper ref={priorityDropdownRef}>
            <PriorityIcon onClick={handlePriorityClick}>
              {tasksHelper.priority.getIconLabel(displayTask.priority)}
            </PriorityIcon>
            <DropdownContainer isOpen={isPriorityDropdownOpen}>
              {Object.values(TaskPriority).map((priority) => (
                <DropdownItem
                  key={priority}
                  onClick={() => handlePrioritySelect(priority)}
                >
                  <PriorityIconSpan>
                    {tasksHelper.priority.getIconLabel(priority)}
                  </PriorityIconSpan>
                  {tasksHelper.priority.getName(priority)}
                </DropdownItem>
              ))}
            </DropdownContainer>
          </PriorityDropdownWrapper>
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
        {/* Description */}
        {isEditingDescription ? (
          <TextEditor
            content={descriptionValue}
            editable={isEditingDescription}
            placeholder="No description provided."
            onUpdate={handleDescriptionUpdate}
            onBlur={handleDescriptionBlur}
          />
        ) : (
          <TaskDescriptionMarkdown onClick={handleDescriptionClick}>
            {descriptionValue || task.description ? (
              <DescriptionContent
                dangerouslySetInnerHTML={{
                  __html: descriptionValue || task.description || "",
                }}
              />
            ) : (
              <NoDescriptionText>No description provided.</NoDescriptionText>
            )}
          </TaskDescriptionMarkdown>
        )}
        <TaskMetadata
          task={displayTask}
          initialTask={initialTask}
          isCreating={isCreating}
          onTaskChange={setTask}
          onPendingMetadataUpdates={(updates) =>
            setPendingUpdates((prev) => ({ ...prev, ...updates }))
          }
        />
        {!isSubtask && displayTask.id && (
          <TaskSubtasks
            task={displayTask}
            onSubtaskClick={onSubtaskClick}
            onTaskUpdate={handleTaskUpdateFromSubtasks}
          />
        )}
        {isCreating ? (
          <TaskViewFooter>
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <CreateTaskButton
              onClick={handleCreateTask}
              disabled={!titleValue.trim() || isCreatingTask}
              inactive={!titleValue.trim() || isCreatingTask}
            >
              {isCreatingTask ? "Creating..." : "Create"}
            </CreateTaskButton>
          </TaskViewFooter>
        ) : (
          <TaskViewFooter>
            <SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
            <TaskSaveButton
              onClick={handleSaveChanges}
              disabled={isSaving || !hasUnsavedChanges}
              inactive={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? "Saving..." : "Save"}
            </TaskSaveButton>
          </TaskViewFooter>
        )}
      </TaskViewContainer>
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete task?"
          description="This will permanently delete this task. This action cannot be undone."
          confirmLabel="Delete task"
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
