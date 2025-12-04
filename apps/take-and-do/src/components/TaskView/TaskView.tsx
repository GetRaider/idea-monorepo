"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Task, TaskPriority, TaskStatus } from "../KanbanBoard/types";
import { tasksService } from "@/services/api/tasks.service";
import TextEditor from "../TextEditor/TextEditor";
import {
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  HeaderLeft,
  CloseButton,
  TaskTitleSection,
  PriorityIcon,
  TaskTitle,
  TaskTitleInput,
  TaskDescription,
  TaskDescriptionMarkdown,
  TaskMetadata,
  MetadataItem,
  MetadataIcon,
  Tag,
  TagDot,
  SubtasksSection,
  SubtasksHeader,
  SubtasksContainer,
  SubtaskItem,
  SubtaskIcon,
  SubtaskContent,
  StatusIconButton,
  DropdownContainer,
  DropdownItem,
} from "./TaskView.styles";
import { getStatusIcon } from "../KanbanBoard/Column/Column";
import { StatusIcon } from "../KanbanBoard/Column/Column.styles";
import { getPriorityIconLabel } from "../KanbanBoard/TaskCard/TaskCard";

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
    async (updates: Partial<Task>) => {
      if (!task) return;
      try {
        const updatedTask = await tasksService.update(task.id, updates);
        setTask(updatedTask);
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask);
        }
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

  const getPriorityName = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return "Low";
      case TaskPriority.MEDIUM:
        return "Medium";
      case TaskPriority.HIGH:
        return "High";
      case TaskPriority.CRITICAL:
        return "Critical";
      default:
        return "Medium";
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}.${month}`;
  };

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
      // Create subtask without id/taskKey - API will generate them
      const newSubtask: Partial<Task> = {
        taskBoardId: task.taskBoardId,
        summary: newSubtaskSummary.trim(),
        description: "",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        subtasks: [],
      };

      // Update parent task with new subtask - API handles id/taskKey generation
      const updatedSubtasks = [...(task.subtasks || []), newSubtask] as Task[];
      const updatedTask = await tasksService.update(task.id, {
        subtasks: updatedSubtasks,
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
        <Header
          workspaceTitle={workspaceTitle}
          task={task}
          parentTask={parentTask}
          statusDropdownRef={statusDropdownRef}
          handleStatusClick={handleStatusClick}
          handleStatusSelect={handleStatusSelect}
          isStatusDropdownOpen={isStatusDropdownOpen}
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

        <TaskMetadata>
          {task.dueDate && (
            <MetadataItem>
              <MetadataIcon>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect
                    x="2"
                    y="3"
                    width="10"
                    height="9"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <path
                    d="M2 5h10M5 2v2M9 2v2"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </MetadataIcon>
              <span>{formatDate(task.dueDate)}</span>
            </MetadataItem>
          )}
          {task.estimation && (
            <MetadataItem>
              <MetadataIcon>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle
                    cx="7"
                    cy="7"
                    r="5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <path
                    d="M7 4v3l2 1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </MetadataIcon>
              <span>{task.estimation}</span>
            </MetadataItem>
          )}
          {task.labels?.map((label, index) => (
            <Tag key={index}>
              <TagDot />
              {label}
            </Tag>
          ))}
        </TaskMetadata>

        {/* Only show subtasks section for main tasks, not subtasks */}
        {!isSubtask && (
          <SubtasksSection>
            <SubtasksHeader>
              <span>Subtasks</span>
              <div>
                <button
                  onClick={() => setIsCreatingSubtask(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    padding: "4px",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#2a2a2a";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.color = "#888";
                  }}
                >
                  +
                </button>
                <button onClick={handleToggleSubtasks}>
                  {isSubtasksExpanded ? "▼" : "▶"}
                </button>
              </div>
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
                  const getSubtaskPriorityIcon = () => {
                    switch (subtask.priority) {
                      case TaskPriority.LOW:
                        return "🔵";
                      case TaskPriority.MEDIUM:
                        return "🟡";
                      case TaskPriority.HIGH:
                        return "🔴";
                      case TaskPriority.CRITICAL:
                        return "🟣";
                      default:
                        return "🟡";
                    }
                  };
                  return (
                    <SubtaskItem
                      key={subtask.id || index}
                      onClick={() => handleSubtaskClick(subtask)}
                    >
                      <StatusIcon $status={subtask.status}>
                        {getStatusIcon(subtask.status)}
                      </StatusIcon>
                      <SubtaskIcon>{getSubtaskPriorityIcon()}</SubtaskIcon>
                      <SubtaskContent>
                        {subtask.taskKey
                          ? `${subtask.taskKey} ${subtask.summary}`
                          : subtask.summary}
                      </SubtaskContent>
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

function Header({
  workspaceTitle,
  task,
  parentTask,
  statusDropdownRef,
  handleStatusClick,
  handleStatusSelect,
  isStatusDropdownOpen,
  onClose,
}: {
  workspaceTitle: string;
  task: Task;
  parentTask?: Task | null;
  statusDropdownRef: React.RefObject<HTMLDivElement>;
  handleStatusClick: () => void;
  handleStatusSelect: (status: TaskStatus) => void;
  isStatusDropdownOpen: boolean;
  onClose: () => void;
}) {
  return (
    <ModalHeader>
      <HeaderLeft>
        {workspaceTitle}{" "}
        <img
          src="/breadcrumb-chevron.svg"
          alt="arrow-right"
          style={{ marginLeft: "8px" }}
          width={14}
          height={14}
        />
        {parentTask?.taskKey && (
          <>
            {parentTask.taskKey}
            <img
              src="/breadcrumb-chevron.svg"
              alt="arrow-right"
              style={{ marginLeft: "8px", marginRight: "8px" }}
              width={14}
              height={14}
            />
          </>
        )}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
          ref={statusDropdownRef}
        >
          <StatusIconButton onClick={handleStatusClick}>
            <StatusIcon $status={task.status}>
              {getStatusIcon(task.status)}
            </StatusIcon>
          </StatusIconButton>
          <DropdownContainer $isOpen={isStatusDropdownOpen}>
            {Object.values(TaskStatus).map((status) => (
              <DropdownItem
                key={status}
                onClick={() => handleStatusSelect(status)}
              >
                <span style={{ marginRight: "8px" }}>
                  <StatusIcon $status={status}>
                    {getStatusIcon(status)}
                  </StatusIcon>
                </span>
                {status}
              </DropdownItem>
            ))}
          </DropdownContainer>
        </div>{" "}
        {task.taskKey}
      </HeaderLeft>
      <CloseButton onClick={onClose} title="Close">
        ×
      </CloseButton>
    </ModalHeader>
  );
}
