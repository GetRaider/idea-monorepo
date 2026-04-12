"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { Task } from "@/components/Boards/KanbanBoard/types";
import {
  LABEL_MENU_EDGE,
  LABEL_MENU_WIDTH,
} from "@/constants/taskMetadata.constants";
import { diffTaskMetadataForPending } from "@/helpers/task-metadata.helper";
import type { TaskMetadataProps } from "@/components/TaskView/TaskMetadata/taskMetadata.types";
import { tasksHelper } from "@/helpers/task.helper";
import { clientServices } from "@/services";

export function useTaskMetadataModel({
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
      const labels = await clientServices.labels.getAll();
      setAvailableLabels(labels);
    };
    void fetchLabels();
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
    const newName = await clientServices.labels.rename({
      oldName,
      newName: trimmed,
    });
    if (!newName) {
      toast.error("Can't rename label");
      return;
    }
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
  };

  const handleConfirmDeleteLabel = async () => {
    if (!labelPendingDelete) return;
    const name = labelPendingDelete;
    setLabelPendingDelete(null);
    const ok = await clientServices.labels.remove(name);
    if (!ok) {
      toast.error("Can't delete label");
      return;
    }
    setAvailableLabels((prev) => prev.filter((l) => l !== name));
    if (task.labels?.includes(name)) {
      updateTask({ labels: task.labels.filter((l) => l !== name) });
    }
    toast.success("Label deleted");
  };
  const handleCreateAndSelectLabel = async () => {
    if (labelSearchValue.trim()) {
      const newLabel = labelSearchValue.trim();
      const created = await clientServices.labels.create(newLabel);
      if (created === null) {
        toast.error("Can't create label");
      } else {
        setAvailableLabels((prev) => [...prev, newLabel]);
        const newLabels = [...(task?.labels || []), newLabel];
        updateTask({ labels: newLabels });
      }
      setIsLabelDropdownOpen(false);
      setLabelSearchValue("");
    }
  };
  const handleRemoveLabel = (labelToRemove: string) => {
    const newLabels = (task?.labels || []).filter((l) => l !== labelToRemove);
    updateTask({ labels: newLabels });
  };

  return {
    task,
    isEditingDueDate,
    dueDateValue,
    setDueDateValue,
    isEditingScheduleDate,
    scheduleDateValue,
    setScheduleDateValue,
    isEditingEstimation,
    estimationDays,
    estimationHours,
    estimationMinutes,
    setEstimationDays,
    setEstimationHours,
    setEstimationMinutes,
    estimationGroupRef,
    labelDropdownRef,
    isLabelDropdownOpen,
    setIsLabelDropdownOpen,
    availableLabels,
    labelSearchValue,
    setLabelSearchValue,
    openMenuLabelName,
    setOpenMenuLabelName,
    editingCatalogLabel,
    setEditingCatalogLabel,
    editingCatalogLabelValue,
    setEditingCatalogLabelValue,
    labelPendingDelete,
    setLabelPendingDelete,
    filteredCatalogLabels,
    handleDueDateClick,
    handleDueDateChange,
    handleDueDateBlur,
    handleScheduleDateClick,
    handleScheduleDateChange,
    handleScheduleDateBlur,
    handleEstimationClick,
    handleEstimationSave,
    handleEstimationBlur,
    handleLabelDropdownToggle,
    handleToggleLabelOnTask,
    handleCatalogLabelAction,
    handleSaveCatalogLabelRename,
    handleConfirmDeleteLabel,
    handleCreateAndSelectLabel,
    handleRemoveLabel,
  };
}

export type TaskMetadataModel = ReturnType<typeof useTaskMetadataModel>;
