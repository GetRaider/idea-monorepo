import {
  formatDateForInput,
  formatDisplayDate,
  formatEstimation,
  parseEstimation,
  toTotalHours,
  formatScheduleDate,
} from "@/utils/task.utils";
import {
  MetadataInput,
  MetadataItem,
  MetadataContainer,
  MetadataIcon,
  EstimationInput,
  EstimationInputGroup,
  EstimationLabel,
  LabelSelectorContainer,
  LabelDropdownItem,
  LabelDropdown,
  LabelDropdownInput,
  Tag,
  TagDot,
  AddLabelTag,
  CreateLabelSpan,
} from "./TaskMetadata.styles";
import { Task, TaskUpdate } from "../../KanbanBoard/types";
import { useState, useRef, useEffect } from "react";
import { labelsService } from "@/services/api/labels.service";

export default function TaskMetadata({
  task,
  handleUpdateTask,
  isCreating = false,
  onTaskChange,
}: TaskMetadataProps) {
  const updateTask = (updates: Partial<Task>) => {
    if (onTaskChange) {
      // Update local task state (works for both create and edit modes)
      onTaskChange({ ...task, ...updates } as Task);
    } else if (handleUpdateTask) {
      // Fallback: call update handler directly (shouldn't happen with new flow)
      handleUpdateTask(updates);
    }
  };
  // Metadata editing states
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [dueDateValue, setDueDateValue] = useState("");
  const [isEditingScheduleDate, setIsEditingScheduleDate] = useState(false);
  const [scheduleDateValue, setScheduleDateValue] = useState("");
  const [isEditingEstimation, setIsEditingEstimation] = useState(false);
  const [estimationDays, setEstimationDays] = useState(0);
  const [estimationHours, setEstimationHours] = useState(0);
  const [estimationMinutes, setEstimationMinutes] = useState(0);
  // Label selector states
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [labelSearchValue, setLabelSearchValue] = useState("");
  const labelDropdownRef = useRef<HTMLDivElement>(null);
  const estimationGroupRef = useRef<HTMLDivElement>(null);

  // Set data
  useEffect(() => {
    if (task?.estimation) {
      const parsed = parseEstimation(task.estimation);
      setEstimationDays(parsed.days);
      setEstimationHours(parsed.hours);
      setEstimationMinutes(parsed.minutes);
    } else {
      setEstimationDays(0);
      setEstimationHours(0);
      setEstimationMinutes(0);
    }
    if (task?.dueDate) {
      setDueDateValue(formatDateForInput(task.dueDate));
    } else {
      setDueDateValue("");
    }
    if (task?.scheduleDate) {
      setScheduleDateValue(formatDateForInput(task.scheduleDate));
    } else {
      setScheduleDateValue("");
    }
  }, [task]);

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
        updateTask({ dueDate: newDate });
      }
    } else {
      updateTask({ dueDate: undefined });
    }
  };
  const handleScheduleDateClick = () => {
    setIsEditingScheduleDate(true);
  };
  const handleScheduleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScheduleDateValue(e.target.value);
  };
  const handleScheduleDateBlur = () => {
    setIsEditingScheduleDate(false);
    if (scheduleDateValue) {
      const newDate = new Date(scheduleDateValue);
      if (!isNaN(newDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const checkDate = new Date(newDate);
        checkDate.setHours(0, 0, 0, 0);

        let schedule: "today" | "tomorrow" | undefined;
        if (checkDate.getTime() === today.getTime()) {
          schedule = "today";
        } else if (checkDate.getTime() === tomorrow.getTime()) {
          schedule = "tomorrow";
        }

        updateTask({
          scheduleDate: newDate,
          schedule,
        });
      }
    } else {
      updateTask({
        scheduleDate: undefined,
        schedule: undefined,
      });
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
    updateTask({ estimation: totalHours > 0 ? totalHours : undefined });
  };
  const handleEstimationBlur = (e: React.FocusEvent) => {
    // Check if the new focus target is still within the estimation group
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (
      estimationGroupRef.current &&
      relatedTarget &&
      estimationGroupRef.current.contains(relatedTarget)
    ) {
      // Focus is moving within the group, don't save yet
      return;
    }
    // Focus is leaving the group, save
    handleEstimationSave();
  };
  const handleLabelDropdownToggle = () => {
    setIsLabelDropdownOpen(!isLabelDropdownOpen);
    setLabelSearchValue("");
  };
  const handleSelectLabel = async (label: string) => {
    if (!task?.labels?.includes(label)) {
      const newLabels = [...(task?.labels || []), label];
      updateTask({ labels: newLabels });
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
        updateTask({ labels: newLabels });
      } catch (error) {
        console.error("Failed to create label:", error);
      }
      setIsLabelDropdownOpen(false);
      setLabelSearchValue("");
    }
  };
  const handleRemoveLabel = (labelToRemove: string) => {
    const newLabels = (task?.labels || []).filter((l) => l !== labelToRemove);
    updateTask({ labels: newLabels });
  };

  return (
    <MetadataContainer>
      {/* Schedule Date */}
      {isEditingScheduleDate ? (
        <MetadataInput
          type="date"
          value={scheduleDateValue}
          onChange={handleScheduleDateChange}
          onBlur={handleScheduleDateBlur}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
            e.key === "Enter" && e.currentTarget.blur()
          }
          autoFocus
          $width="130px"
        />
      ) : (
        <MetadataItem
          onClick={handleScheduleDateClick}
          title="Click to edit schedule"
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
              <circle cx="7" cy="8" r="1.5" fill="currentColor" />
            </svg>
          </MetadataIcon>
          <span>
            {task.scheduleDate
              ? formatScheduleDate(task.scheduleDate)
              : "Set schedule"}
          </span>
        </MetadataItem>
      )}

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
          $width="130px"
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
            {task.dueDate ? formatDisplayDate(task.dueDate) : "Set due date"}
          </span>
        </MetadataItem>
      )}

      {/* Estimation */}
      {isEditingEstimation ? (
        <EstimationInputGroup ref={estimationGroupRef}>
          <EstimationInput
            type="number"
            value={estimationDays || ""}
            onChange={(e) => setEstimationDays(parseInt(e.target.value) || 0)}
            onKeyDown={(e) => e.key === "Enter" && handleEstimationSave()}
            onBlur={handleEstimationBlur}
            placeholder="0"
            min="0"
          />
          <EstimationLabel>d</EstimationLabel>
          <EstimationInput
            type="number"
            value={estimationHours || ""}
            onChange={(e) => setEstimationHours(parseInt(e.target.value) || 0)}
            onKeyDown={(e) => e.key === "Enter" && handleEstimationSave()}
            onBlur={handleEstimationBlur}
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
            onBlur={handleEstimationBlur}
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
          <span>{formatEstimation(task.estimation) || "Set estimation"}</span>
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

      {/* Add Label */}
      <LabelSelectorContainer ref={labelDropdownRef}>
        <AddLabelTag onClick={handleLabelDropdownToggle} title="Add label">
          + Label
        </AddLabelTag>
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
                label.toLowerCase().includes(labelSearchValue.toLowerCase()) &&
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
                <CreateLabelSpan>+</CreateLabelSpan>
                Create &quot;{labelSearchValue}&quot;
              </LabelDropdownItem>
            )}
        </LabelDropdown>
      </LabelSelectorContainer>
    </MetadataContainer>
  );
}

interface TaskMetadataProps {
  task: Task;
  handleUpdateTask?: (updates: TaskUpdate) => void;
  isCreating?: boolean;
  onTaskChange?: (task: Task) => void;
}
