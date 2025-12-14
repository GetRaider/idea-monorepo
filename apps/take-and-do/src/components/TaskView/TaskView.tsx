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
}: TaskViewProps) {
  const isSubtask = !!parentTask;
  const [task, setTask] = useState<Task | null>(initialTask);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTask(initialTask);
    if (initialTask) {
      setTitleValue(initialTask.summary);
      setDescriptionValue(initialTask.description || "");
    }
  }, [initialTask]);

  // Update URL based on current task/subtask
  useEffect(() => {
    if (!initialTask?.taskKey) {
      // Clear URL when task view is closed - go back to /tasks
      window.history.replaceState(null, "", "/tasks");
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
  }, [initialTask?.taskKey, parentTask?.taskKey]);

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
      if (!task) return;
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
    if (descriptionValue !== (task?.description || "")) {
      handleUpdateTask({ description: descriptionValue });
    }
  }, [descriptionValue, task?.description, handleUpdateTask]);

  if (!task) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (titleValue !== task.summary) {
      handleUpdateTask({ summary: titleValue });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setTitleValue(task.summary);
      setIsEditingTitle(false);
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
    handleUpdateTask({ priority });
  };

  const handleStatusClick = () => {
    setIsStatusDropdownOpen(!isStatusDropdownOpen);
  };

  const handleStatusSelect = (status: TaskStatus) => {
    setIsStatusDropdownOpen(false);
    handleUpdateTask({ status });
  };

  return (
    <TaskViewOverlay onClick={handleOverlayClick}>
      <TaskViewContainer onClick={(e) => e.stopPropagation()}>
        <TaskViewHeader
          workspaceTitle={workspaceTitle}
          task={task}
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
              {getPriorityIconLabel(task.priority)}
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
            />
          ) : (
            <TaskTitle onClick={handleTitleClick}>{task.summary}</TaskTitle>
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
        <TaskMetadata task={task} handleUpdateTask={handleUpdateTask} />
        {!isSubtask && (
          <TaskSubtasks
            task={task}
            onSubtaskClick={onSubtaskClick}
            onTaskUpdate={handleTaskUpdateFromSubtasks}
          />
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
}
