"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTask(initialTask);
    if (initialTask) {
      setTitleValue(initialTask.summary);
      setDescriptionValue(initialTask.description || "");
    } else {
      setTitleValue("");
      setDescriptionValue("");
    }
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
      } catch (error) {
        console.error("Failed to update task:", error);
      }
    },
    [task, onTaskUpdate],
  );

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
    if (isCreating && !task?.id) {
      // Don't update description for new tasks until they're created
      return;
    }
    if (descriptionValue !== (task?.description || "")) {
      handleUpdateTask({ description: descriptionValue });
    }
  }, [
    descriptionValue,
    task?.description,
    handleUpdateTask,
    isCreating,
    task?.id,
  ]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleBlur = () => {
    if (isCreating && !task?.id) {
      // In create mode, don't auto-create on blur
      // User must click save button
      return;
    }

    setIsEditingTitle(false);
    if (task && titleValue !== task.summary) {
      handleUpdateTask({ summary: titleValue });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (isCreating && !task?.id) {
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
    if (isCreating && !task?.id) {
      // Update local state for new task
      if (task) {
        setTask({ ...task, priority });
      }
    } else {
      handleUpdateTask({ priority });
    }
  };

  const handleStatusClick = () => {
    setIsStatusDropdownOpen(!isStatusDropdownOpen);
  };

  const handleStatusSelect = (status: TaskStatus) => {
    setIsStatusDropdownOpen(false);
    if (isCreating && !task?.id) {
      // Update local state for new task
      if (task) {
        setTask({ ...task, status });
      }
    } else {
      handleUpdateTask({ status });
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
          <div
            style={{ position: "relative", display: "flex" }}
            ref={priorityDropdownRef}
          >
            <PriorityIcon onClick={handlePriorityClick}>
              {getPriorityIconLabel(displayTask.priority)}
            </PriorityIcon>
            <DropdownContainer $isOpen={isPriorityDropdownOpen}>
              {Object.values(TaskPriority).map((priority) => (
                <DropdownItem
                  key={priority}
                  onClick={() => handlePrioritySelect(priority)}
                >
                  <span style={{ marginRight: "8px" }}>
                    {getPriorityIconLabel(priority)}
                  </span>
                  {getPriorityName(priority)}
                </DropdownItem>
              ))}
            </DropdownContainer>
          </div>
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
              {displayTask.summary || "Untitled Task"}
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
            {descriptionValue ? (
              <div
                dangerouslySetInnerHTML={{ __html: descriptionValue }}
                style={{
                  color: "#888",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              />
            ) : (
              <span style={{ color: "#666" }}>No description provided.</span>
            )}
          </TaskDescriptionMarkdown>
        )}
        <TaskMetadata
          task={displayTask}
          handleUpdateTask={isCreating ? undefined : handleUpdateTask}
          isCreating={isCreating}
          onTaskChange={isCreating ? setTask : undefined}
        />
        {!isSubtask && displayTask.id && (
          <TaskSubtasks
            task={displayTask}
            onSubtaskClick={onSubtaskClick}
            onTaskUpdate={handleTaskUpdateFromSubtasks}
          />
        )}
        {isCreating && (
          <div
            style={{
              padding: "24px",
              borderTop: "1px solid #2a2a2a",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                background: "transparent",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                color: "#888",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTask}
              disabled={!titleValue.trim() || isCreatingTask}
              style={{
                padding: "8px 16px",
                background:
                  titleValue.trim() && !isCreatingTask ? "#7255c1" : "#2a2a2a",
                border: "none",
                borderRadius: "6px",
                color: titleValue.trim() && !isCreatingTask ? "#fff" : "#666",
                cursor:
                  titleValue.trim() && !isCreatingTask
                    ? "pointer"
                    : "not-allowed",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {isCreatingTask ? "Creating..." : "Create Task"}
            </button>
          </div>
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
