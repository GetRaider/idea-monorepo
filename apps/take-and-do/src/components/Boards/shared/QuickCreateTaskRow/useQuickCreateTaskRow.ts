"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { localStorageHelper } from "@/helpers/local-storage.helper";
import { useClickOutside } from "@/hooks/ui/useClickOutside";

import { TaskPriority, TaskStatus } from "../../KanbanBoard/types";

import {
  buildQuickCreateDraftStorageKey,
  buildQuickCreateStoredDraft,
  hasQuickCreateDraftContent,
  hydrateQuickCreateDraftFromStorage,
} from "./quick-create-task-draft.helper";

import type {
  QuickCreateTaskInput,
  QuickCreateTaskRowProps,
} from "./QuickCreateTaskRow.types";

type UseQuickCreateTaskRowParams = Pick<
  QuickCreateTaskRowProps,
  | "onCreate"
  | "defaultStatus"
  | "defaultPriority"
  | "defaultScheduleDate"
  | "taskBoardId"
  | "boardOptions"
  | "defaultBoardId"
>;

export function useQuickCreateTaskRow({
  onCreate,
  defaultStatus = TaskStatus.TODO,
  defaultPriority = TaskPriority.MEDIUM,
  defaultScheduleDate,
  taskBoardId,
  boardOptions,
  defaultBoardId,
}: UseQuickCreateTaskRowParams) {
  const isMultiBoard = !!boardOptions && boardOptions.length > 0;
  const defaultBoardIdResolved =
    defaultBoardId ?? boardOptions?.[0]?.id ?? taskBoardId;

  const draftStorageKey = useMemo(
    () => buildQuickCreateDraftStorageKey(isMultiBoard, taskBoardId),
    [isMultiBoard, taskBoardId],
  );

  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(defaultPriority);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(
    defaultScheduleDate,
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [estimation, setEstimation] = useState<number | undefined>(undefined);
  const [selectedBoardId, setSelectedBoardId] = useState<string | undefined>(
    defaultBoardIdResolved,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const draftHydratedForOpenRef = useRef(false);

  const setContainerRef = useCallback((node: HTMLElement | null) => {
    containerRef.current = node;
  }, []);

  useEffect(() => {
    setSelectedBoardId(defaultBoardIdResolved);
  }, [defaultBoardIdResolved]);

  useEffect(() => {
    setScheduleDate(defaultScheduleDate);
  }, [defaultScheduleDate]);

  const reset = useCallback(
    (options?: { removeStoredDraft?: boolean }) => {
      const removeStoredDraft = options?.removeStoredDraft !== false;
      setTitle("");
      setStatus(defaultStatus);
      setPriority(defaultPriority);
      setScheduleDate(defaultScheduleDate);
      setDueDate(undefined);
      setEstimation(undefined);
      setSelectedBoardId(defaultBoardIdResolved);
      setIsExpanded(false);
      if (removeStoredDraft) {
        localStorageHelper.removeItem(draftStorageKey);
      }
    },
    [
      defaultBoardIdResolved,
      defaultPriority,
      defaultScheduleDate,
      defaultStatus,
      draftStorageKey,
    ],
  );

  const draftFields = useMemo(
    () => ({
      title,
      status,
      priority,
      scheduleDate,
      dueDate,
      estimation,
      selectedBoardId,
    }),
    [
      title,
      status,
      priority,
      scheduleDate,
      dueDate,
      estimation,
      selectedBoardId,
    ],
  );

  const hasDraftContent = useCallback(
    () =>
      hasQuickCreateDraftContent(draftFields, {
        defaultStatus,
        defaultPriority,
        defaultScheduleDate,
        defaultBoardId: defaultBoardIdResolved,
        isMultiBoard,
      }),
    [
      draftFields,
      defaultStatus,
      defaultPriority,
      defaultScheduleDate,
      defaultBoardIdResolved,
      isMultiBoard,
    ],
  );

  const persistDraftToStorage = useCallback(() => {
    localStorageHelper.writeItem(
      draftStorageKey,
      buildQuickCreateStoredDraft(draftFields),
    );
  }, [draftFields, draftStorageKey]);

  useClickOutside(containerRef, isExpanded, () => {
    if (hasDraftContent()) {
      persistDraftToStorage();
    } else {
      localStorageHelper.removeItem(draftStorageKey);
    }
    reset({ removeStoredDraft: false });
  });

  useEffect(() => {
    if (!isExpanded) {
      draftHydratedForOpenRef.current = false;
      return;
    }
    if (draftHydratedForOpenRef.current) {
      queueMicrotask(() => inputRef.current?.focus());
      return;
    }
    draftHydratedForOpenRef.current = true;
    hydrateQuickCreateDraftFromStorage(
      draftStorageKey,
      { defaultScheduleDate, isMultiBoard, boardOptions },
      {
        setTitle,
        setStatus,
        setPriority,
        setScheduleDate,
        setDueDate,
        setEstimation,
        setSelectedBoardId,
      },
    );
    queueMicrotask(() => inputRef.current?.focus());
  }, [
    isExpanded,
    draftStorageKey,
    isMultiBoard,
    boardOptions,
    defaultScheduleDate,
  ]);

  const resolvedBoardId = isMultiBoard ? selectedBoardId : taskBoardId;

  const handleSubmit = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      const trimmed = title.trim();
      if (!trimmed || !resolvedBoardId || isSubmitting) return;
      setIsSubmitting(true);
      try {
        const input: QuickCreateTaskInput = {
          summary: trimmed,
          priority,
          status,
          scheduleDate,
          dueDate,
          estimation,
          taskBoardId: resolvedBoardId,
        };
        await onCreate(input);
        reset();
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      title,
      resolvedBoardId,
      isSubmitting,
      onCreate,
      status,
      priority,
      scheduleDate,
      dueDate,
      estimation,
      reset,
    ],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        reset();
      }
    },
    [reset],
  );

  return {
    isExpanded,
    setIsExpanded,
    title,
    setTitle,
    status,
    setStatus,
    priority,
    setPriority,
    scheduleDate,
    setScheduleDate,
    dueDate,
    setDueDate,
    estimation,
    setEstimation,
    selectedBoardId,
    setSelectedBoardId,
    isSubmitting,
    inputRef,
    setContainerRef,
    handleSubmit,
    handleKeyDown,
    reset,
    isMultiBoard,
    resolvedBoardId,
    boardOptions,
  };
}
