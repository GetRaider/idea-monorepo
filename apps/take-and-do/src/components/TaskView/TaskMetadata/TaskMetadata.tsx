"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  type ButtonHTMLAttributes,
  type ComponentProps,
  type HTMLAttributes,
  type InputHTMLAttributes,
} from "react";
import { tasksHelper } from "@/helpers/task.helper";
import { CalendarIcon, ClockIcon, DotsVerticalIcon } from "@/components/Icons";
import { Dropdown } from "@/components/Dropdown";
import { ConfirmDialog } from "@/components/Dialogs";
import { Input } from "@/components/Input";
import { Task } from "../../Boards/KanbanBoard/types";
import { clientServices } from "@/services/client";
import { getLabelAccent } from "@/helpers/label-color.helper";
import { toast } from "sonner";

const LABEL_MENU_WIDTH = 200;
const LABEL_MENU_EDGE = 10;

function joinClassNames(
  ...parts: Array<string | undefined | false | null>
): string {
  return parts.filter(Boolean).join(" ");
}

function MetadataContainer({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={joinClassNames(
        "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-2 px-6 py-3 max-[600px]:gap-2 max-[600px]:px-4",
        className,
      )}
      {...props}
    />
  );
}

function MetadataItem({
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "flex cursor-pointer items-center gap-1.5 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-[#888] transition-all duration-200 hover:border-input-border hover:bg-[#2a2a2a]",
        className,
      )}
      {...props}
    />
  );
}

type MetadataInputProps = ComponentProps<typeof Input> & { width?: string };

function MetadataInput({
  className,
  style,
  width,
  ...props
}: MetadataInputProps) {
  return (
    <Input
      style={{ ...style, width: width ?? "80px" }}
      className={joinClassNames("px-2 py-1", className)}
      {...props}
    />
  );
}

function MetadataIcon({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={joinClassNames("flex items-center text-[#888]", className)}
      {...props}
    />
  );
}

function EstimationInput({
  className,
  type = "number",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={joinClassNames(
        "w-10 border-0 bg-transparent px-1.5 py-1 text-center text-[13px] text-white outline-none [-moz-appearance:textfield] focus:rounded focus:bg-white/5 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className,
      )}
      {...props}
    />
  );
}

function EstimationLabel({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={joinClassNames(
        "min-w-[10px] text-[11px] text-[#666]",
        className,
      )}
      {...props}
    />
  );
}

type LabelDropdownProps = HTMLAttributes<HTMLDivElement> & { isOpen: boolean };

function LabelDropdown({ className, isOpen, ...props }: LabelDropdownProps) {
  return (
    <div
      className={joinClassNames(
        "absolute left-[var(--label-menu-left,0px)] right-auto top-full z-[1001] mt-1 box-border max-h-60 w-[200px] max-w-[min(200px,calc(100vw-48px))] overflow-y-auto rounded-lg border border-input-border bg-input-bg shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
        isOpen ? "block" : "hidden",
        className,
      )}
      {...props}
    />
  );
}

type LabelDropdownRowProps = HTMLAttributes<HTMLDivElement> & {
  activeMenu?: boolean;
};

function LabelDropdownRow({
  className,
  activeMenu,
  ...props
}: LabelDropdownRowProps) {
  return (
    <div
      className={joinClassNames(
        "group flex items-center justify-between gap-2 pl-3 [&+&]:border-t [&+&]:border-input-border",
        activeMenu ? "bg-white/[0.04]" : "bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

type LabelDropdownRowToggleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  onTask?: boolean;
};

function LabelDropdownRowToggle({
  className,
  type = "button",
  onTask,
  ...props
}: LabelDropdownRowToggleProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent py-2.5 pl-0 pr-2 text-left text-[13px] transition-colors duration-150 hover:text-white",
        onTask ? "text-gray-200" : "text-[#aaa]",
        className,
      )}
      {...props}
    />
  );
}

function LabelDropdownRowLabelText({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={joinClassNames(
        "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

function LabelRowActions({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={joinClassNames(
        "inline-flex shrink-0 items-center justify-center py-0 pl-1 pr-2 text-[#888] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-data-[menu-open=true]:opacity-100 [&_[data-label-actions-trigger]]:inline-flex [&_[data-label-actions-trigger]]:items-center [&_[data-label-actions-trigger]]:justify-center [&_[data-label-actions-trigger]]:rounded [&_[data-label-actions-trigger]]:p-1",
        className,
      )}
      {...props}
    />
  );
}

function LabelDropdownEditInput({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  return (
    <Input
      className={joinClassNames(
        "my-1.5 mr-2 flex-1 px-2.5 py-2 text-[13px]",
        className,
      )}
      {...props}
    />
  );
}

type LabelDropdownItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isSelected?: boolean;
};

function LabelDropdownItem({
  className,
  type = "button",
  isSelected,
  ...props
}: LabelDropdownItemProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "flex w-full cursor-pointer items-center gap-2 border-0 px-3 py-2.5 text-left text-[13px] text-white transition-all duration-200 first:rounded-t-lg last:rounded-b-lg hover:bg-[#3a3a3a]",
        isSelected ? "bg-[#3a3a3a]" : "bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

function LabelDropdownInput({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  return (
    <Input
      className={joinClassNames(
        "w-full border-0 border-b border-input-border bg-transparent px-3 py-2.5 text-[13px] text-white outline-none placeholder:text-[#666]",
        className,
      )}
      {...props}
    />
  );
}

type TagProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tintBg?: string;
  tintHoverBg?: string;
  tintBorder?: string;
};

function Tag({
  className,
  type = "button",
  style,
  tintBg,
  tintHoverBg,
  tintBorder,
  onMouseEnter,
  onMouseLeave,
  ...props
}: TagProps) {
  const defaultBg = tintBg ?? "rgba(102, 126, 234, 0.1)";
  return (
    <button
      type={type}
      style={{
        ...style,
        background: defaultBg,
      }}
      className={joinClassNames(
        "flex min-w-0 max-w-[min(220px,100%)] cursor-pointer items-center gap-1.5 rounded-md border border-transparent px-2.5 py-1 text-xs font-medium text-[#888] transition-all duration-200 hover:border-[rgba(102,126,234,0.3)]",
        className,
      )}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        if (tintHoverBg) {
          event.currentTarget.style.background = tintHoverBg;
        } else {
          event.currentTarget.style.background = "rgba(102, 126, 234, 0.2)";
        }
        if (tintBorder) {
          event.currentTarget.style.borderColor = tintBorder;
        }
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        event.currentTarget.style.background = defaultBg;
        event.currentTarget.style.borderColor = "transparent";
      }}
      {...props}
    />
  );
}

function TagText({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={joinClassNames(
        "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

type TagDotProps = HTMLAttributes<HTMLSpanElement> & { color?: string };

function TagDot({ className, style, color, ...props }: TagDotProps) {
  return (
    <span
      style={{ ...style, background: color ?? "var(--brand-primary)" }}
      className={joinClassNames("h-1.5 w-1.5 shrink-0 rounded-full", className)}
      {...props}
    />
  );
}

function AddLabelTag({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & TagProps) {
  return (
    <Tag
      tintBg="transparent"
      tintHoverBg="#2a2a2a"
      tintBorder="#4a4a4a"
      className={joinClassNames(
        "border border-dashed border-input-border text-[#666]",
        className,
      )}
      {...props}
    />
  );
}

type CreateLabelSpanProps = HTMLAttributes<HTMLSpanElement> & {
  accentColor?: string;
};

function CreateLabelSpan({
  className,
  style,
  accentColor,
  ...props
}: CreateLabelSpanProps) {
  return (
    <span
      style={{ ...style, color: accentColor ?? "var(--brand-primary)" }}
      className={className}
      {...props}
    />
  );
}

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
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [dueDateValue, setDueDateValue] = useState("");
  const [isEditingScheduleDate, setIsEditingScheduleDate] = useState(false);
  const [scheduleDateValue, setScheduleDateValue] = useState("");
  const [isEditingEstimation, setIsEditingEstimation] = useState(false);
  const [estimationDays, setEstimationDays] = useState(0);
  const [estimationHours, setEstimationHours] = useState(0);
  const [estimationMinutes, setEstimationMinutes] = useState(0);
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
    const query = labelSearchValue.toLowerCase();
    return [...availableLabels]
      .filter((label) => label.toLowerCase().includes(query))
      .sort((a, b) => a.localeCompare(b));
  }, [availableLabels, labelSearchValue]);

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
        const labels = await clientServices.labels.getAll();
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
      const element = labelDropdownRef.current;
      if (!element) return;
      const shell = element.closest(
        "[data-task-view-container]",
      ) as HTMLElement | null;
      const tr = element.getBoundingClientRect();
      const sr = shell?.getBoundingClientRect();
      const lo = sr ? sr.left + LABEL_MENU_EDGE : LABEL_MENU_EDGE;
      const hi = sr
        ? sr.right - LABEL_MENU_EDGE - LABEL_MENU_WIDTH
        : window.innerWidth - LABEL_MENU_EDGE - LABEL_MENU_WIDTH;
      const desiredLeft = Math.max(lo, Math.min(tr.left, Math.max(lo, hi)));
      element.style.setProperty(
        "--label-menu-left",
        `${desiredLeft - tr.left}px`,
      );
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
      const newDate = tasksHelper.date.parseCalendarDay(dueDateValue);
      if (newDate) {
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
      const newDate = tasksHelper.date.parseCalendarDay(scheduleDateValue);
      if (newDate) {
        updateTask({ scheduleDate: newDate });
      }
    } else {
      updateTask({ scheduleDate: undefined });
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
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (
      estimationGroupRef.current &&
      relatedTarget &&
      estimationGroupRef.current.contains(relatedTarget)
    ) {
      return;
    }
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
      const newName = await clientServices.labels.rename({
        oldName,
        newName: trimmed,
      });
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
      await clientServices.labels.remove(name);
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
        await clientServices.labels.create(newLabel);
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
          width="130px"
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
          width="130px"
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

      {isEditingEstimation ? (
        <div
          ref={estimationGroupRef}
          className="flex shrink-0 items-center gap-0.5 rounded-md border border-input-border bg-input-bg px-2 py-1 focus-within:border-accent-primary"
        >
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
        </div>
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
            tintBg={accent.tintBg}
            tintHoverBg={accent.tintHoverBg}
            tintBorder={accent.tintBorder}
            onClick={() => handleRemoveLabel(label)}
            title="Click to remove"
          >
            <TagDot color={accent.dot} />
            <TagText>{label}</TagText>
          </Tag>
        );
      })}

      <div ref={labelDropdownRef} className="relative shrink-0">
        <AddLabelTag onClick={handleLabelDropdownToggle} title="Add label">
          + Label
        </AddLabelTag>
        <LabelDropdown isOpen={isLabelDropdownOpen}>
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
                activeMenu={isMenuOpen}
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
                      onTask={onTask}
                      onClick={() => handleToggleLabelOnTask(label)}
                      title={onTask ? "Remove from task" : "Add to task"}
                    >
                      <TagDot color={accent.dot} />
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
                  accentColor={getLabelAccent(labelSearchValue.trim()).dot}
                >
                  +
                </CreateLabelSpan>
                Create &quot;{labelSearchValue}&quot;
              </LabelDropdownItem>
            )}
        </LabelDropdown>
      </div>

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

  const initialScheduleDate = tasksHelper.date.getTime(initial.scheduleDate);
  const updatedScheduleDate = tasksHelper.date.getTime(updated.scheduleDate);
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
