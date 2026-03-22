import { tasksHelper } from "@/helpers/task.helper";
import { CalendarIcon, ClockIcon, DotsVerticalIcon } from "@/components/Icons";
import { Dropdown } from "@/components/Dropdown";
import { ConfirmDialog } from "@/components/Dialogs";
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
  LabelDropdownRow,
  LabelDropdownRowToggle,
  LabelDropdownRowLabelText,
  LabelRowActions,
  LabelDropdownEditInput,
  Tag,
  TagText,
  TagDot,
  AddLabelTag,
  CreateLabelSpan,
} from "./TaskMetadata.styles";
import { Task } from "../../Boards/KanbanBoard/types";
import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { apiServices } from "@/services/api";
import { getLabelAccent } from "@/helpers/label-color.helper";
import { toast } from "sonner";

const LABEL_MENU_WIDTH = 200;
const LABEL_MENU_EDGE = 10;

export function TaskMetadata({
  task,
  initialTask,
  isCreating = false,
  onTaskChange,
  onPendingMetadataUpdates,
}: TaskMetadataProps) {
  const emitTaskUpdate = (next: Task) => {
    onTaskChange?.(next);
    if (isCreating || !initialTask?.id) return;
    const delta = diffTaskMetadataForPending(initialTask, next);
    if (Object.keys(delta).length > 0) {
      onPendingMetadataUpdates?.(delta);
    }
  };

  const updateTask = (updates: Partial<Task>) => {
    emitTaskUpdate({ ...task, ...updates } as Task);
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
  const [openMenuLabelName, setOpenMenuLabelName] = useState<string | null>(
    null,
  );
  const [editingCatalogLabel, setEditingCatalogLabel] = useState<string | null>(
    null,
  );
  const [editingCatalogLabelValue, setEditingCatalogLabelValue] = useState("");
  const [labelPendingDelete, setLabelPendingDelete] = useState<string | null>(
    null,
  );
  const labelDropdownRef = useRef<HTMLDivElement>(null);
  const estimationGroupRef = useRef<HTMLDivElement>(null);

  const filteredCatalogLabels = useMemo(() => {
    const q = labelSearchValue.toLowerCase();
    return [...availableLabels]
      .filter((label) => label.toLowerCase().includes(q))
      .sort((a, b) => a.localeCompare(b));
  }, [availableLabels, labelSearchValue]);

  // Set data
  useEffect(() => {
    if (task?.estimation) {
      const parsed = tasksHelper.estimation.parse(task.estimation);
      setEstimationDays(parsed.days);
      setEstimationHours(parsed.hours);
      setEstimationMinutes(parsed.minutes);
    } else {
      setEstimationDays(0);
      setEstimationHours(0);
      setEstimationMinutes(0);
    }
    if (task?.dueDate) {
      setDueDateValue(tasksHelper.date.formatForInput(task.dueDate));
    } else {
      setDueDateValue("");
    }
    if (task?.scheduleDate) {
      setScheduleDateValue(tasksHelper.date.formatForInput(task.scheduleDate));
    } else {
      setScheduleDateValue("");
    }
  }, [task]);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const labels = await apiServices.labels.getAll();
        setAvailableLabels(labels);
      } catch (error) {
        console.error("Failed to fetch labels:", error);
      }
    };
    fetchLabels();
  }, []);

  useLayoutEffect(() => {
    if (!isLabelDropdownOpen) {
      labelDropdownRef.current?.style.removeProperty("--label-menu-left");
      return;
    }
    const wrap = labelDropdownRef.current;
    if (!wrap) return;

    const run = () => {
      const el = labelDropdownRef.current;
      if (!el) return;
      const shell = el.closest(
        "[data-task-view-container]",
      ) as HTMLElement | null;
      const tr = el.getBoundingClientRect();
      const sr = shell?.getBoundingClientRect();
      const lo = sr ? sr.left + LABEL_MENU_EDGE : LABEL_MENU_EDGE;
      const hi = sr
        ? sr.right - LABEL_MENU_EDGE - LABEL_MENU_WIDTH
        : window.innerWidth - LABEL_MENU_EDGE - LABEL_MENU_WIDTH;
      const desiredLeft = Math.max(lo, Math.min(tr.left, Math.max(lo, hi)));
      el.style.setProperty("--label-menu-left", `${desiredLeft - tr.left}px`);
    };

    run();
    const shell = wrap.closest(
      "[data-task-view-container]",
    ) as HTMLElement | null;
    window.addEventListener("resize", run);
    shell?.addEventListener("scroll", run, { passive: true });

    return () => {
      window.removeEventListener("resize", run);
      shell?.removeEventListener("scroll", run);
      wrap.style.removeProperty("--label-menu-left");
    };
  }, [
    isLabelDropdownOpen,
    filteredCatalogLabels.length,
    editingCatalogLabel,
    labelSearchValue,
  ]);

  useEffect(() => {
    if (!isLabelDropdownOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (labelDropdownRef.current?.contains(t)) return;
      const el = t as Element;
      if (el.closest?.("[data-dropdown-portal]")) return;
      setIsLabelDropdownOpen(false);
      setLabelSearchValue("");
      setEditingCatalogLabel(null);
      setOpenMenuLabelName(null);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isLabelDropdownOpen]);

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
      // Parse YYYY-MM-DD as local date, not UTC
      const dateParts = scheduleDateValue.split("-");
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        const newDate = new Date(year, month, day);
        if (!isNaN(newDate.getTime())) {
          updateTask({
            scheduleDate: newDate,
          });
        }
      }
    } else {
      updateTask({
        scheduleDate: undefined,
      });
    }
  };
  const handleEstimationClick = () => {
    setIsEditingEstimation(true);
  };
  const handleEstimationSave = () => {
    setIsEditingEstimation(false);
    const totalHours = tasksHelper.estimation.toTotalHours(
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
    setIsLabelDropdownOpen((open) => !open);
    setLabelSearchValue("");
    setEditingCatalogLabel(null);
    setOpenMenuLabelName(null);
  };

  const handleToggleLabelOnTask = (label: string) => {
    const current = task?.labels || [];
    if (current.includes(label)) {
      updateTask({ labels: current.filter((l) => l !== label) });
    } else {
      updateTask({ labels: [...current, label] });
    }
  };

  const handleCatalogLabelAction = (label: string, action: string) => {
    if (action === "edit") {
      setEditingCatalogLabel(label);
      setEditingCatalogLabelValue(label);
    }
    if (action === "delete") {
      setIsLabelDropdownOpen(false);
      setLabelSearchValue("");
      setEditingCatalogLabel(null);
      setOpenMenuLabelName(null);
      setLabelPendingDelete(label);
    }
  };

  const handleSaveCatalogLabelRename = async (oldName: string) => {
    const trimmed = editingCatalogLabelValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCatalogLabel(null);
      return;
    }
    try {
      const newName = await apiServices.labels.rename(oldName, trimmed);
      setAvailableLabels((prev) =>
        [...prev.map((l) => (l === oldName ? newName : l))].sort((a, b) =>
          a.localeCompare(b),
        ),
      );
      if (task.labels?.includes(oldName)) {
        updateTask({
          labels: task.labels.map((l) => (l === oldName ? newName : l)),
        });
      }
      setEditingCatalogLabel(null);
      toast.success("Label renamed");
    } catch (error) {
      console.error("Failed to rename label:", error);
      toast.error("Failed to rename label");
    }
  };

  const handleConfirmDeleteLabel = async () => {
    if (!labelPendingDelete) return;
    const name = labelPendingDelete;
    setLabelPendingDelete(null);
    try {
      await apiServices.labels.remove(name);
      setAvailableLabels((prev) => prev.filter((l) => l !== name));
      if (task.labels?.includes(name)) {
        updateTask({ labels: task.labels.filter((l) => l !== name) });
      }
      toast.success("Label deleted");
    } catch (error) {
      console.error("Failed to delete label:", error);
      toast.error("Failed to delete label");
    }
  };
  const handleCreateAndSelectLabel = async () => {
    if (labelSearchValue.trim()) {
      const newLabel = labelSearchValue.trim();
      try {
        await apiServices.labels.create(newLabel);
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
          title="Click to edit schedule date"
        >
          <MetadataIcon>
            <CalendarIcon size={14} showDot />
          </MetadataIcon>
          <span>
            {task.scheduleDate
              ? tasksHelper.date.formatForSchedule(task.scheduleDate)
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
            <CalendarIcon size={14} />
          </MetadataIcon>
          <span>
            {task.dueDate
              ? tasksHelper.date.formatForDisplay(task.dueDate)
              : "Set due date"}
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
            <ClockIcon size={14} />
          </MetadataIcon>
          <span>
            {task.estimation
              ? tasksHelper.estimation.format(task.estimation)
              : "Set estimation"}
          </span>
        </MetadataItem>
      )}

      {task.labels?.map((label) => {
        const accent = getLabelAccent(label);
        return (
          <Tag
            key={label}
            $tintBg={accent.tintBg}
            $tintHoverBg={accent.tintHoverBg}
            $tintBorder={accent.tintBorder}
            onClick={() => handleRemoveLabel(label)}
            title="Click to remove"
          >
            <TagDot $color={accent.dot} />
            <TagText>{label}</TagText>
          </Tag>
        );
      })}

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
                setEditingCatalogLabel(null);
                setOpenMenuLabelName(null);
              }
            }}
            placeholder="Search or create..."
            autoFocus={isLabelDropdownOpen}
            maxLength={32}
          />
          {filteredCatalogLabels.map((label) => {
            const accent = getLabelAccent(label);
            const onTask = !!task.labels?.includes(label);
            const isEditingRow = editingCatalogLabel === label;
            const isMenuOpen = openMenuLabelName === label;

            return (
              <LabelDropdownRow
                key={label}
                $activeMenu={isMenuOpen}
                data-menu-open={isMenuOpen ? "true" : undefined}
              >
                {isEditingRow ? (
                  <LabelDropdownEditInput
                    value={editingCatalogLabelValue}
                    onChange={(e) =>
                      setEditingCatalogLabelValue(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSaveCatalogLabelRename(label);
                      }
                      if (e.key === "Escape") {
                        setEditingCatalogLabel(null);
                        setEditingCatalogLabelValue("");
                      }
                    }}
                    onBlur={(e) => {
                      const next = e.relatedTarget as HTMLElement | null;
                      if (
                        next?.closest("[data-dropdown-portal]") ||
                        (next &&
                          labelDropdownRef.current?.contains(next) &&
                          next.closest('[aria-haspopup="menu"]'))
                      )
                        return;
                      void handleSaveCatalogLabelRename(label);
                    }}
                    autoFocus
                    maxLength={32}
                  />
                ) : (
                  <>
                    <LabelDropdownRowToggle
                      type="button"
                      $onTask={onTask}
                      onClick={() => handleToggleLabelOnTask(label)}
                      title={onTask ? "Remove from task" : "Add to task"}
                    >
                      <TagDot $color={accent.dot} />
                      <LabelDropdownRowLabelText>
                        {label}
                      </LabelDropdownRowLabelText>
                    </LabelDropdownRowToggle>
                    <LabelRowActions>
                      <Dropdown
                        options={[
                          { label: "Edit", value: "edit" },
                          { label: "Delete", value: "delete", danger: true },
                        ]}
                        onChange={(value) =>
                          handleCatalogLabelAction(label, value)
                        }
                        trigger={
                          <span data-label-actions-trigger>
                            <DotsVerticalIcon size={14} />
                          </span>
                        }
                        onOpenChange={(open) =>
                          setOpenMenuLabelName(open ? label : null)
                        }
                      />
                    </LabelRowActions>
                  </>
                )}
              </LabelDropdownRow>
            );
          })}
          {labelSearchValue.trim() &&
            !availableLabels.some(
              (l) => l.toLowerCase() === labelSearchValue.toLowerCase(),
            ) && (
              <LabelDropdownItem onClick={handleCreateAndSelectLabel}>
                <CreateLabelSpan
                  $accentColor={getLabelAccent(labelSearchValue.trim()).dot}
                >
                  +
                </CreateLabelSpan>
                Create &quot;{labelSearchValue}&quot;
              </LabelDropdownItem>
            )}
        </LabelDropdown>
      </LabelSelectorContainer>

      {labelPendingDelete && (
        <ConfirmDialog
          title={`Delete "${labelPendingDelete}" label?`}
          description="This removes the label from your workspace and unassigns it from all tasks. This cannot be undone."
          confirmLabel="Delete label"
          maxWidth={380}
          onConfirm={handleConfirmDeleteLabel}
          onClose={() => setLabelPendingDelete(null)}
        />
      )}
    </MetadataContainer>
  );
}

function getTimestampForCompare(
  date: Date | string | undefined | null,
): number | undefined {
  if (!date) return undefined;
  if (date instanceof Date) return date.getTime();
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? undefined : parsed.getTime();
}

function diffTaskMetadataForPending(
  initial: Task,
  updated: Task,
): Partial<Task> {
  const updates: Partial<Task> = {};

  const initialDueDate = getTimestampForCompare(initial.dueDate);
  const updatedDueDate = getTimestampForCompare(updated.dueDate);
  if (initialDueDate !== updatedDueDate) {
    updates.dueDate = updated.dueDate;
  }

  const initialScheduleDate = getTimestampForCompare(initial.scheduleDate);
  const updatedScheduleDate = getTimestampForCompare(updated.scheduleDate);
  if (initialScheduleDate !== updatedScheduleDate) {
    updates.scheduleDate = updated.scheduleDate;
  }

  if (updated.estimation !== initial.estimation) {
    updates.estimation = updated.estimation;
  }

  const initialLabels = JSON.stringify(initial.labels || []);
  const updatedLabels = JSON.stringify(updated.labels || []);
  if (updatedLabels !== initialLabels) {
    updates.labels = updated.labels;
  }

  if (updated.priority !== initial.priority) {
    updates.priority = updated.priority;
  }

  if (updated.status !== initial.status) {
    updates.status = updated.status;
  }

  return updates;
}

interface TaskMetadataProps {
  task: Task;
  initialTask: Task | null;
  isCreating?: boolean;
  onTaskChange?: (task: Task) => void;
  onPendingMetadataUpdates?: (updates: Partial<Task>) => void;
}
