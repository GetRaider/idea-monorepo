"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Task, TaskPriority, TaskStatus } from "../KanbanBoard/types";
import { tasksService } from "@/services/api/tasks.service";
import { labelsService } from "@/services/api/labels.service";
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
  MetadataInput,
  MetadataIcon,
  Tag,
  TagDot,
  LabelSelectorContainer,
  LabelDropdown,
  LabelDropdownItem,
  LabelDropdownInput,
  EstimationInputGroup,
  EstimationInput,
  EstimationLabel,
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
  // Metadata editing states
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [dueDateValue, setDueDateValue] = useState("");
  const [isEditingEstimation, setIsEditingEstimation] = useState(false);
  const [estimationDays, setEstimationDays] = useState(0);
  const [estimationHours, setEstimationHours] = useState(0);
  const [estimationMinutes, setEstimationMinutes] = useState(0);
  // Label selector states
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [labelSearchValue, setLabelSearchValue] = useState("");
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const labelDropdownRef = useRef<HTMLDivElement>(null);

  // Parse hours to days/hours/minutes
  const parseEstimation = (hours: number) => {
    const totalMinutes = Math.round(hours * 60);
    const days = Math.floor(totalMinutes / (24 * 60));
    const remainingAfterDays = totalMinutes % (24 * 60);
    const hrs = Math.floor(remainingAfterDays / 60);
    const mins = remainingAfterDays % 60;
    return { days, hours: hrs, minutes: mins };
  };

  // Convert days/hours/minutes to total hours
  const toTotalHours = (days: number, hours: number, minutes: number) => {
    return days * 24 + hours + minutes / 60;
  };

  // Format date for input element
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    setTask(initialTask);
    if (initialTask) {
      setTitleValue(initialTask.summary);
      setDescriptionValue(initialTask.description || "");
      setDueDateValue(
        initialTask.dueDate ? formatDateForInput(initialTask.dueDate) : "",
      );
      if (initialTask.estimation) {
        const parsed = parseEstimation(initialTask.estimation);
        setEstimationDays(parsed.days);
        setEstimationHours(parsed.hours);
        setEstimationMinutes(parsed.minutes);
      } else {
        setEstimationDays(0);
        setEstimationHours(0);
        setEstimationMinutes(0);
      }
    }
  }, [initialTask]);

  // Fetch available labels
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const labels = await labelsService.getAll();
        setAvailableLabels(labels);
      } catch (error) {
        console.error("Failed to fetch labels:", error);
      }
    };
    fetchLabels();
  }, []);

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
      if (
        labelDropdownRef.current &&
        !labelDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLabelDropdownOpen(false);
        setLabelSearchValue("");
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
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatEstimation = (hours?: number) => {
    if (!hours) return "";
    const parsed = parseEstimation(hours);
    const parts = [];
    if (parsed.days > 0) parts.push(`${parsed.days}d`);
    if (parsed.hours > 0) parts.push(`${parsed.hours}h`);
    if (parsed.minutes > 0) parts.push(`${parsed.minutes}m`);
    return parts.length > 0 ? parts.join(" ") : "0h";
  };

  const handleDueDateClick = () => {
    setIsEditingDueDate(true);
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDateValue(e.target.value);
  };

  const handleDueDateBlur = () => {
    setIsEditingDueDate(false);
    if (dueDateValue) {
      const newDate = new Date(dueDateValue);
      if (!isNaN(newDate.getTime())) {
        handleUpdateTask({ dueDate: newDate });
      }
    } else {
      // Use null to explicitly clear (undefined gets stripped by JSON.stringify)
      handleUpdateTask({ dueDate: null as unknown as Date });
    }
  };

  const handleEstimationClick = () => {
    setIsEditingEstimation(true);
  };

  const handleEstimationSave = () => {
    setIsEditingEstimation(false);
    const totalHours = toTotalHours(
      estimationDays,
      estimationHours,
      estimationMinutes,
    );
    if (totalHours > 0) {
      handleUpdateTask({ estimation: totalHours });
    } else {
      // Use null to explicitly clear (undefined gets stripped by JSON.stringify)
      handleUpdateTask({ estimation: null as unknown as number });
    }
  };

  const handleLabelDropdownToggle = () => {
    setIsLabelDropdownOpen(!isLabelDropdownOpen);
    setLabelSearchValue("");
  };

  const handleSelectLabel = async (label: string) => {
    if (!task?.labels?.includes(label)) {
      const newLabels = [...(task?.labels || []), label];
      handleUpdateTask({ labels: newLabels });
    }
    setIsLabelDropdownOpen(false);
    setLabelSearchValue("");
  };

  const handleCreateAndSelectLabel = async () => {
    if (labelSearchValue.trim()) {
      const newLabel = labelSearchValue.trim();
      try {
        await labelsService.create(newLabel);
        setAvailableLabels((prev) => [...prev, newLabel]);
        const newLabels = [...(task?.labels || []), newLabel];
        handleUpdateTask({ labels: newLabels });
      } catch (error) {
        console.error("Failed to create label:", error);
      }
      setIsLabelDropdownOpen(false);
      setLabelSearchValue("");
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    const newLabels = (task?.labels || []).filter((l) => l !== labelToRemove);
    handleUpdateTask({ labels: newLabels });
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
          {/* Due Date */}
          {isEditingDueDate ? (
            <MetadataInput
              type="date"
              value={dueDateValue}
              onChange={handleDueDateChange}
              onBlur={handleDueDateBlur}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                e.key === "Enter" && e.currentTarget.blur()
              }
              autoFocus
              style={{ width: "130px" }}
            />
          ) : (
            <MetadataItem
              onClick={handleDueDateClick}
              title="Click to edit due date"
            >
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
              <span>
                {task.dueDate ? formatDate(task.dueDate) : "Set due date"}
              </span>
            </MetadataItem>
          )}

          {/* Estimation */}
          {isEditingEstimation ? (
            <EstimationInputGroup>
              <EstimationInput
                type="number"
                value={estimationDays || ""}
                onChange={(e) =>
                  setEstimationDays(parseInt(e.target.value) || 0)
                }
                onKeyDown={(e) => e.key === "Enter" && handleEstimationSave()}
                placeholder="0"
                min="0"
              />
              <EstimationLabel>d</EstimationLabel>
              <EstimationInput
                type="number"
                value={estimationHours || ""}
                onChange={(e) =>
                  setEstimationHours(parseInt(e.target.value) || 0)
                }
                onKeyDown={(e) => e.key === "Enter" && handleEstimationSave()}
                placeholder="0"
                min="0"
                max="23"
                autoFocus
              />
              <EstimationLabel>h</EstimationLabel>
              <EstimationInput
                type="number"
                value={estimationMinutes || ""}
                onChange={(e) =>
                  setEstimationMinutes(parseInt(e.target.value) || 0)
                }
                onKeyDown={(e) => e.key === "Enter" && handleEstimationSave()}
                onBlur={handleEstimationSave}
                placeholder="0"
                min="0"
                max="59"
              />
              <EstimationLabel>m</EstimationLabel>
            </EstimationInputGroup>
          ) : (
            <MetadataItem
              onClick={handleEstimationClick}
              title="Click to edit estimation"
            >
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
              <span>
                {formatEstimation(task.estimation) || "Set estimation"}
              </span>
            </MetadataItem>
          )}

          {/* Labels */}
          {task.labels?.map((label, index) => (
            <Tag
              key={index}
              onClick={() => handleRemoveLabel(label)}
              title="Click to remove"
            >
              <TagDot />
              {label}
            </Tag>
          ))}

          {/* Add Label Dropdown */}
          <LabelSelectorContainer ref={labelDropdownRef}>
            <Tag
              onClick={handleLabelDropdownToggle}
              title="Add label"
              style={{
                background: "transparent",
                border: "1px dashed #3a3a3a",
                color: "#666",
              }}
            >
              + Label
            </Tag>
            <LabelDropdown $isOpen={isLabelDropdownOpen}>
              <LabelDropdownInput
                type="text"
                value={labelSearchValue}
                onChange={(e) => setLabelSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateAndSelectLabel();
                  } else if (e.key === "Escape") {
                    setIsLabelDropdownOpen(false);
                    setLabelSearchValue("");
                  }
                }}
                placeholder="Search or create..."
                autoFocus={isLabelDropdownOpen}
              />
              {availableLabels
                .filter(
                  (label) =>
                    label
                      .toLowerCase()
                      .includes(labelSearchValue.toLowerCase()) &&
                    !task.labels?.includes(label),
                )
                .map((label) => (
                  <LabelDropdownItem
                    key={label}
                    onClick={() => handleSelectLabel(label)}
                  >
                    <TagDot />
                    {label}
                  </LabelDropdownItem>
                ))}
              {labelSearchValue.trim() &&
                !availableLabels.some(
                  (l) => l.toLowerCase() === labelSearchValue.toLowerCase(),
                ) && (
                  <LabelDropdownItem onClick={handleCreateAndSelectLabel}>
                    <span style={{ color: "#667eea" }}>+</span>
                    Create &quot;{labelSearchValue}&quot;
                  </LabelDropdownItem>
                )}
            </LabelDropdown>
          </LabelSelectorContainer>
        </TaskMetadata>

        {/* Only show subtasks section for main tasks, not subtasks */}
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
