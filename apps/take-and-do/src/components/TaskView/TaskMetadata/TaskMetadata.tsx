import {
  formatDateForInput,
  formatDisplayDate,
  formatEstimation,
  parseEstimation,
  toTotalHours,
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
} from "./TaskMetadata.styles";
import { Task, TaskUpdate } from "../../KanbanBoard/types";
import { useState, useRef, useEffect } from "react";
import { labelsService } from "@/services/api/labels.service";

export default function TaskMetadata({
  task,
  handleUpdateTask,
}: TaskMetadataProps) {
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
        handleUpdateTask({ dueDate: newDate });
      }
    } else {
      handleUpdateTask({ dueDate: null });
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
    handleUpdateTask({ estimation: totalHours > 0 ? totalHours : null });
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

  return (
    <MetadataContainer>
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
                <span style={{ color: "#667eea" }}>+</span>
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
  handleUpdateTask: (updates: TaskUpdate) => void;
}
