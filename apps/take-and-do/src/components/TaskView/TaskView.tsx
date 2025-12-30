"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskUpdate,
} from "../KanbanBoard/types";
import { tasksService } from "@/services/api/tasks.service";
import TextEditor from "../TextEditor/TextEditor";
import { getPriorityName } from "@/utils/task.utils";
import { TaskViewHeader } from "./TaskViewHeader/TaskViewHeader";
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
  FooterCancelButton,
  CreateTaskButton,
  TaskSaveButton,
} from "./TaskView.styles";
import { getPriorityIconLabel } from "../KanbanBoard/TaskCard/TaskCard";
import TaskMetadata from "./TaskMetadata/TaskMetadata";
import TaskSubtasks from "./TaskSubtasks/TaskSubtasks";

export default function TaskView({
  task: initialTask,
  parentTask,
  workspaceTitle,
  onClose,
  onTaskUpdate,
  onSubtaskClick,
  onTaskCreated,
}: TaskViewProps) {
  const isSubtask = !!parentTask;
  const [task, setTask] = useState<Task | null>(initialTask);
  const isCreating = !initialTask || !initialTask.id;
  const [isEditingTitle, setIsEditingTitle] = useState(isCreating);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Partial<Task>>({});

  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
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

  // Update URL based on current task/subtask
  useEffect(() => {
    if (!initialTask?.taskKey || !initialTask?.id) {
      // Don't update URL for new tasks or when task view is closed
      if (!initialTask) {
        window.history.replaceState(null, "", "/tasks");
      }
      return;
    }

    let newUrl: string;
    if (parentTask?.taskKey) {
      // Viewing a subtask: /tasks/PARENT-KEY/SUBTASK-KEY
      newUrl = `/tasks/${parentTask.taskKey}/${initialTask.taskKey}`;
    } else {
      // Viewing a main task: /tasks/TASK-KEY
      newUrl = `/tasks/${initialTask.taskKey}`;
    }

    // Update URL without page reload
    window.history.replaceState(null, "", newUrl);
  }, [initialTask?.taskKey, initialTask?.id, parentTask?.taskKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPriorityDropdownOpen(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUpdateTask = useCallback(
    async (updates: TaskUpdate) => {
      if (!task || !task.id) return;
      try {
        const updatedTask = await tasksService.update(task.id, updates);
        setTask(updatedTask);
        onTaskUpdate?.(updatedTask);
        setPendingUpdates({});
        // Reset form values to match updated task
        setTitleValue(updatedTask.summary);
        setDescriptionValue(updatedTask.description || "");
      } catch (error) {
        console.error("Failed to update task:", error);
      }
    },
    [task, onTaskUpdate],
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
      task && setTask({ ...task, priority });
    } else {
      setPendingUpdates((prev) => ({ ...prev, priority }));
      setTask((prev) => (prev ? { ...prev, priority } : null));
    }
  };

  const handleStatusClick = () => {
    setIsStatusDropdownOpen(!isStatusDropdownOpen);
  };

  const handleStatusSelect = (status: TaskStatus) => {
    setIsStatusDropdownOpen(false);
    if (shouldCreateTask) {
      task && setTask({ ...task, status });
    } else {
      setPendingUpdates((prev) => ({ ...prev, status }));
      setTask((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleCreateTask = async () => {
    if (!task || !titleValue.trim() || isCreatingTask || !task.taskBoardId)
      return;

    setIsCreatingTask(true);
    try {
      const taskData: Omit<Task, "id"> = {
        taskBoardId: task.taskBoardId,
        summary: titleValue.trim(),
        description: descriptionValue || "",
        status: task.status || TaskStatus.TODO,
        priority: task.priority || TaskPriority.MEDIUM,
        labels: task.labels,
        dueDate: task.dueDate,
        estimation: task.estimation,
        schedule: task.schedule,
        subtasks: task.subtasks,
      };

      const createdTask = await tasksService.create(taskData);
      setTask(createdTask);
      onTaskCreated?.(createdTask);
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Only render if we have a task (either existing or for creation)
  if (!task) return null;

  const displayTask = task;

  return (
    <TaskViewOverlay onClick={handleOverlayClick}>
      <TaskViewContainer onClick={(e) => e.stopPropagation()}>
        <TaskViewHeader
          workspaceTitle={workspaceTitle}
          task={displayTask}
          parentTask={parentTask}
          statusDropdownRef={statusDropdownRef}
          isStatusDropdownOpen={isStatusDropdownOpen}
          onStatusClick={handleStatusClick}
          onStatusSelect={handleStatusSelect}
          onClose={onClose}
        />
        <TaskTitleSection>
          <PriorityDropdownWrapper ref={priorityDropdownRef}>
            <PriorityIcon onClick={handlePriorityClick}>
              {getPriorityIconLabel(displayTask.priority)}
            </PriorityIcon>
            <DropdownContainer $isOpen={isPriorityDropdownOpen}>
              {Object.values(TaskPriority).map((priority) => (
                <DropdownItem
                  key={priority}
                  onClick={() => handlePrioritySelect(priority)}
                >
                  <PriorityIconSpan>
                    {getPriorityIconLabel(priority)}
                  </PriorityIconSpan>
                  {getPriorityName(priority)}
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
          handleUpdateTask={undefined}
          isCreating={isCreating}
          onTaskChange={(updatedTask) => {
            setTask(updatedTask);
            if (!isCreating && initialTask) {
              // Helper to safely get timestamp from date (handles Date objects and strings)
              const getTimestamp = (
                date: Date | string | undefined | null,
              ): number | undefined => {
                if (!date) return undefined;
                if (date instanceof Date) return date.getTime();
                const parsed = new Date(date);
                return isNaN(parsed.getTime()) ? undefined : parsed.getTime();
              };

              // Track changes for save (compare against initial task)
              const updates: Partial<Task> = {};

              const initialDueDate = getTimestamp(initialTask.dueDate);
              const updatedDueDate = getTimestamp(updatedTask.dueDate);
              if (initialDueDate !== updatedDueDate) {
                updates.dueDate = updatedTask.dueDate;
              }

              const initialScheduleDate = getTimestamp(
                initialTask.scheduleDate,
              );
              const updatedScheduleDate = getTimestamp(
                updatedTask.scheduleDate,
              );
              if (initialScheduleDate !== updatedScheduleDate) {
                updates.scheduleDate = updatedTask.scheduleDate;
              }

              if (updatedTask.schedule !== initialTask.schedule) {
                updates.schedule = updatedTask.schedule;
              }

              if (updatedTask.estimation !== initialTask.estimation) {
                updates.estimation = updatedTask.estimation;
              }

              const initialLabels = JSON.stringify(initialTask.labels || []);
              const updatedLabels = JSON.stringify(updatedTask.labels || []);
              if (updatedLabels !== initialLabels) {
                updates.labels = updatedTask.labels;
              }

              if (updatedTask.priority !== initialTask.priority) {
                updates.priority = updatedTask.priority;
              }

              if (updatedTask.status !== initialTask.status) {
                updates.status = updatedTask.status;
              }

              // Only update if there are actual changes
              if (Object.keys(updates).length > 0) {
                setPendingUpdates((prev) => ({ ...prev, ...updates }));
              }
            }
          }}
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
            <FooterCancelButton onClick={onClose}>Cancel</FooterCancelButton>
            <CreateTaskButton
              onClick={handleCreateTask}
              disabled={!titleValue.trim() || isCreatingTask}
              $disabled={!titleValue.trim() || isCreatingTask}
            >
              {isCreatingTask ? "Creating..." : "Create Task"}
            </CreateTaskButton>
          </TaskViewFooter>
        ) : (
          <TaskViewFooter>
            <FooterCancelButton onClick={handleCancel}>
              Cancel
            </FooterCancelButton>
            <TaskSaveButton
              onClick={handleSaveChanges}
              disabled={isSaving || !hasUnsavedChanges}
              $disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? "Saving..." : "Save"}
            </TaskSaveButton>
          </TaskViewFooter>
        )}
      </TaskViewContainer>
    </TaskViewOverlay>
  );
}

interface TaskViewProps {
  task: Task | null;
  parentTask?: Task | null;
  workspaceTitle: string;
  onClose: () => void;
  onTaskUpdate?: (updatedTask: Task) => void;
  onSubtaskClick?: (subtask: Task) => void;
  onTaskCreated?: (createdTask: Task) => void;
}
