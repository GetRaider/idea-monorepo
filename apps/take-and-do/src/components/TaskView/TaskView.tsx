"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskUpdate,
} from "../KanbanBoard/types";
import { tasksService } from "@/services/api/tasks.service";
import { labelsService } from "@/services/api/labels.service";
import TextEditor from "../TextEditor/TextEditor";
import {
  parseEstimation,
  formatDateForInput,
  getPriorityName,
} from "@/utils/task.utils";
import { TaskViewHeader } from "./TaskViewHeader/TaskViewHeader";
import {
  ModalOverlay,
  ModalContainer,
  TaskTitleSection,
  PriorityIcon,
  TaskTitle,
  TaskTitleInput,
  TaskDescriptionMarkdown,
  SubtasksSection,
  SubtasksHeader,
  SubtasksHeaderButtons,
  SubtasksHeaderButton,
  SubtasksContainer,
  SubtaskItem,
  SubtaskHeader,
  SubtaskKey,
  SubtaskIcon,
  SubtaskContent,
  DropdownContainer,
  DropdownItem,
} from "./TaskView.styles";
import { getStatusIcon } from "../KanbanBoard/Column/Column";
import { StatusIcon } from "../KanbanBoard/Column/Column.styles";
import { getPriorityIconLabel } from "../KanbanBoard/TaskCard/TaskCard";
import TaskMetadata from "./TaskMetadata/TaskMetadata";

interface TaskViewProps {
  task: Task | null;
  parentTask?: Task | null;
  workspaceTitle: string;
  onClose: () => void;
  onTaskUpdate?: (updatedTask: Task) => void;
  onSubtaskClick?: (subtask: Task) => void;
}

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
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(true);
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [newSubtaskSummary, setNewSubtaskSummary] = useState("");

  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTask(initialTask);
    if (initialTask) {
      setTitleValue(initialTask.summary);
      setDescriptionValue(initialTask.description || "");
      // if (initialTask.estimation) {
      //   const parsed = parseEstimation(initialTask.estimation);
      //   setEstimationDays(parsed.days);
      //   setEstimationHours(parsed.hours);
      //   setEstimationMinutes(parsed.minutes);
      // } else {
      //   setEstimationDays(0);
      //   setEstimationHours(0);
      //   setEstimationMinutes(0);
      // }
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

  const handleSubtaskClick = (subtask: Task) => {
    if (onSubtaskClick) {
      onSubtaskClick(subtask);
    }
  };

  const handleToggleSubtasks = () => {
    setIsSubtasksExpanded(!isSubtasksExpanded);
  };

  const handleCreateSubtask = async () => {
    if (!task || !newSubtaskSummary.trim()) return;

    try {
      // Create new subtask without id/taskKey - API will generate them
      const newSubtask: Partial<Task> = {
        taskBoardId: task.taskBoardId,
        summary: newSubtaskSummary.trim(),
        description: "",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        subtasks: [],
      };

      // Preserve existing subtasks with their IDs, add new one at the end
      const existingSubtasks = (task.subtasks || []).map((st) => ({
        ...st,
        // Ensure dueDate is serializable
        dueDate:
          st.dueDate instanceof Date ? st.dueDate.toISOString() : st.dueDate,
      }));

      const updatedSubtasks = [...existingSubtasks, newSubtask];
      const updatedTask = await tasksService.update(task.id, {
        subtasks: updatedSubtasks as Task[],
      });

      // Update local state with response from API (includes generated id/taskKey)
      setTask(updatedTask);
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }

      setNewSubtaskSummary("");
      setIsCreatingSubtask(false);
    } catch (error) {
      console.error("Failed to create subtask:", error);
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
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
        /* TODO: Potentially separate to another file */
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
          <SubtasksSection>
            <SubtasksHeader>
              <span>Subtasks</span>
              <SubtasksHeaderButtons>
                <SubtasksHeaderButton
                  onClick={() => setIsCreatingSubtask(true)}
                  title="Add subtask"
                >
                  +
                </SubtasksHeaderButton>
                <SubtasksHeaderButton
                  onClick={handleToggleSubtasks}
                  title={isSubtasksExpanded ? "Collapse" : "Expand"}
                >
                  {isSubtasksExpanded ? "▼" : "▶"}
                </SubtasksHeaderButton>
              </SubtasksHeaderButtons>
            </SubtasksHeader>
            <SubtasksContainer $isExpanded={isSubtasksExpanded}>
              {isCreatingSubtask && (
                <div style={{ marginBottom: "8px" }}>
                  <input
                    type="text"
                    value={newSubtaskSummary}
                    onChange={(e) => setNewSubtaskSummary(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateSubtask();
                      } else if (e.key === "Escape") {
                        setIsCreatingSubtask(false);
                        setNewSubtaskSummary("");
                      }
                    }}
                    placeholder="Enter subtask summary..."
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "#2a2a2a",
                      border: "1px solid #3a3a3a",
                      borderRadius: "6px",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    onBlur={() => {
                      if (!newSubtaskSummary.trim()) {
                        setIsCreatingSubtask(false);
                      }
                    }}
                  />
                </div>
              )}
              {task.subtasks && task.subtasks.length > 0 ? (
                task.subtasks.map((subtask, index) => {
                  return (
                    <SubtaskItem
                      key={subtask.id || index}
                      onClick={() => handleSubtaskClick(subtask)}
                    >
                      <SubtaskHeader>
                        <StatusIcon $status={subtask.status}>
                          {getStatusIcon(subtask.status)}
                        </StatusIcon>
                        <SubtaskIcon>
                          {getPriorityIconLabel(subtask.priority)}
                        </SubtaskIcon>
                        {subtask.taskKey && (
                          <SubtaskKey>{subtask.taskKey}</SubtaskKey>
                        )}
                      </SubtaskHeader>
                      <SubtaskContent>{subtask.summary}</SubtaskContent>
                    </SubtaskItem>
                  );
                })
              ) : !isCreatingSubtask ? (
                <div
                  style={{ color: "#666", fontSize: "14px", padding: "8px" }}
                >
                  No subtasks yet
                </div>
              ) : null}
            </SubtasksContainer>
          </SubtasksSection>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
}
