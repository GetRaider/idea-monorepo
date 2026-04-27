"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { Task, TaskUpdate } from "@/components/Boards/KanbanBoard/types";
import {
  LABEL_MENU_EDGE,
  LABEL_MENU_WIDTH,
} from "@/constants/taskMetadata.constants";
import type { TaskMetadataProps } from "@/components/TaskView/TaskMetadata/taskMetadata.types";
import { tasksHelper } from "@/helpers/task.helper";
import { queryKeys } from "@/lib/query-keys";
import { clientServices } from "@/services";

function toLocalTaskPatch(updates: TaskUpdate): Partial<Task> {
  const patch = { ...updates } as Partial<Task>;
  if ("dueDate" in updates) patch.dueDate = updates.dueDate ?? undefined;
  if ("scheduleDate" in updates) {
    patch.scheduleDate = updates.scheduleDate ?? undefined;
  }
  if ("estimation" in updates)
    patch.estimation = updates.estimation ?? undefined;
  return patch;
}

function toEstimationMinutes(value: number | undefined | null): number {
  return Math.round((value ?? 0) * 60);
}

export function useTaskMetadataModel({
  task,
  initialTask,
  isCreating = false,
  onTaskChange,
  onPendingMetadataUpdates,
}: TaskMetadataProps) {
  const emitTaskUpdate = (next: Task, updates: TaskUpdate) => {
    onTaskChange?.(next);
    if (isCreating || !initialTask?.id) return;
    if (Object.keys(updates).length > 0) {
      onPendingMetadataUpdates?.(updates);
    }
  };

  const updateTask = (updates: TaskUpdate) => {
    emitTaskUpdate({ ...task, ...toLocalTaskPatch(updates) } as Task, updates);
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
  const queryClient = useQueryClient();

  const labelsQuery = useQuery({
    queryKey: queryKeys.labels,
    queryFn: () => clientServices.labels.getAll(),
  });

  const availableLabels = useMemo(
    () => labelsQuery.data ?? [],
    [labelsQuery.data],
  );

  const renameLabelMutation = useMutation({
    mutationFn: (params: { oldName: string; newName: string }) =>
      clientServices.labels.rename(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.labels });
    },
  });

  const removeLabelMutation = useMutation({
    mutationFn: (name: string) => clientServices.labels.remove(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.labels });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const createLabelMutation = useMutation({
    mutationFn: (label: string) => clientServices.labels.create(label),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.labels });
    },
  });

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
    const currentValue = tasksHelper.date.formatForInput(task.dueDate);
    if (dueDateValue === currentValue) return;
    if (dueDateValue) {
      const newDate = tasksHelper.date.parseCalendarDay(dueDateValue);
      if (newDate) {
        updateTask({ dueDate: newDate });
      }
    } else {
      updateTask({ dueDate: null });
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
    const currentValue = tasksHelper.date.formatForInput(task.scheduleDate);
    if (scheduleDateValue === currentValue) return;
    if (scheduleDateValue) {
      const newDate = tasksHelper.date.parseCalendarDay(scheduleDateValue);
      if (newDate) {
        updateTask({ scheduleDate: newDate });
      }
    } else {
      updateTask({ scheduleDate: null });
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
    if (
      toEstimationMinutes(totalHours) === toEstimationMinutes(task.estimation)
    ) {
      return;
    }
    updateTask({ estimation: totalHours > 0 ? totalHours : null });
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
    const newName = await renameLabelMutation.mutateAsync({
      oldName,
      newName: trimmed,
    });
    if (!newName) {
      toast.error("Can't rename label");
      return;
    }
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
    const ok = await removeLabelMutation.mutateAsync(name);
    if (!ok) {
      toast.error("Can't delete label");
      return;
    }
    if (task.labels?.includes(name)) {
      updateTask({ labels: task.labels.filter((l) => l !== name) });
    }
    toast.success("Label deleted");
  };
  const handleCreateAndSelectLabel = async () => {
    if (labelSearchValue.trim()) {
      const newLabel = labelSearchValue.trim();
      const created = await createLabelMutation.mutateAsync(newLabel);
      if (created === null) {
        toast.error("Can't create label");
      } else {
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
