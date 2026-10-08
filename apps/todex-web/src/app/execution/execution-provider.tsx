"use client";

import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ExecutionCurrent,
  ExecutionQueueItem,
  ExecutionSession,
} from "@repo/api/todex";
import { toast } from "sonner";

import { todexClient } from "@lib/todex-client";

import { focusSeconds, type FocusMode } from "./execution-time";

const ExecutionContext = createContext<ExecutionContextValue | null>(null);

export function ExecutionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const queryClient = useQueryClient();
  const onExecution = pathname.startsWith("/execution");
  const stateQuery = useQuery({
    queryKey: ["execution", "state"],
    queryFn: () => todexClient.execution.state(),
  });
  const sessionsQuery = useQuery({
    queryKey: ["execution", "sessions"],
    queryFn: () => todexClient.execution.sessions(),
    enabled: onExecution,
  });
  const session = stateQuery.data?.session ?? null;
  const tasks = stateQuery.data?.tasks ?? [];
  const focusedTaskId = stateQuery.data?.focusedTaskId ?? null;
  const focused = tasks.find((task) => task.id === focusedTaskId) ?? null;
  const tracking =
    focused?.intervals.some((interval) => interval.endedAt == null) ?? false;
  const [mode, setMode] = useState<FocusMode>("timer");
  const [goalMinutes, setGoalMinutes] = useState<number | null>(
    focused?.estimation ?? null,
  );
  const [trackedTaskId, setTrackedTaskId] = useState(focused?.id ?? null);
  const [now, setNow] = useState(() => Date.now());
  const [syncedAt, setSyncedAt] = useState(() => Date.now());
  const [intervalKey, setIntervalKey] = useState("");
  const nextIntervalKey =
    focused?.intervals
      .map((interval) => `${interval.startedAt}:${interval.endedAt ?? ""}`)
      .join("|") ?? "";
  if ((focused?.id ?? null) !== trackedTaskId || nextIntervalKey !== intervalKey) {
    setTrackedTaskId(focused?.id ?? null);
    setIntervalKey(nextIntervalKey);
    setSyncedAt(Date.now());
    if ((focused?.id ?? null) !== trackedTaskId) {
      setGoalMinutes(focused?.estimation ?? null);
      setMode("timer");
    }
  }

  useEffect(() => {
    if (!tracking) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [tracking, focused?.id]);

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ["execution"] });
  }

  const executeTask = useMutation({
    mutationFn: (taskIds: string[]) =>
      todexClient.execution.execute({ taskIds }),
    onSuccess: invalidate,
    onError: (error) => toast.error(readError(error, "Could not execute the task")),
  });
  const focusTask = useMutation({
    mutationFn: (taskId: string) => todexClient.execution.focus({ taskId }),
    onSuccess: invalidate,
    onError: (error) => toast.error(readError(error, "Could not switch task")),
  });
  const pause = useMutation({
    mutationFn: () => todexClient.execution.pause(),
    onSuccess: invalidate,
    onError: (error) => toast.error(readError(error, "Could not pause execution")),
  });
  const resume = useMutation({
    mutationFn: () => todexClient.execution.resume(),
    onSuccess: invalidate,
    onError: (error) => toast.error(readError(error, "Could not resume execution")),
  });
  const updateSession = useMutation({
    mutationFn: (input: {
      sessionId: string;
      startedAt: string;
      endedAt: string;
    }) =>
      todexClient.execution.updateSession(input.sessionId, {
        startedAt: input.startedAt,
        endedAt: input.endedAt,
      }),
    onSuccess: invalidate,
    onError: (error) =>
      toast.error(readError(error, "Could not update the session")),
  });
  const deleteSession = useMutation({
    mutationFn: (sessionId: string) =>
      todexClient.execution.deleteSession(sessionId),
    onSuccess: invalidate,
    onError: (error) =>
      toast.error(readError(error, "Could not delete the session")),
  });
  const removeQueued = useMutation({
    mutationFn: (taskId: string) => todexClient.execution.removeQueued(taskId),
    onSuccess: invalidate,
    onError: (error) =>
      toast.error(readError(error, "Could not remove the queued task")),
  });
  const reorder = useMutation({
    mutationFn: (taskIds: string[]) =>
      todexClient.execution.reorder({ taskIds }),
    onSuccess: invalidate,
    onError: (error) => toast.error(readError(error, "Could not reorder the queue")),
  });
  const complete = useMutation({
    mutationFn: () => todexClient.execution.complete(),
    onSuccess: invalidate,
    onError: (error) =>
      toast.error(readError(error, "Could not complete execution")),
  });

  const elapsedSeconds = focused
    ? focused.actualTime +
      (tracking ? Math.max(0, Math.floor((now - syncedAt) / 1000)) : 0)
    : 0;
  const estimateMinutes = focused?.estimation ?? null;
  const shownSeconds =
    mode === "timer"
      ? estimateMinutes == null
        ? null
        : focusSeconds({
            mode,
            elapsedSeconds,
            goalMinutes: estimateMinutes,
          })
      : focusSeconds({
          mode,
          elapsedSeconds,
          goalMinutes: goalMinutes ?? estimateMinutes ?? 0,
        });

  const value: ExecutionContextValue = {
    state: {
      session,
      tasks,
      focused,
      queue: stateQuery.data?.queue ?? [],
      sessions: sessionsQuery.data ?? [],
      isLoading:
        stateQuery.isLoading || (onExecution && sessionsQuery.isLoading),
      isPending:
        stateQuery.isPending || (onExecution && sessionsQuery.isPending),
      isError: stateQuery.isError || (onExecution && sessionsQuery.isError),
    },
    actions: {
      execute: (taskIds) => executeTask.mutate(taskIds),
      focus: (taskId) => focusTask.mutate(taskId),
      pause: () => pause.mutate(),
      resume: () => resume.mutate(),
      removeQueued: (taskId) => removeQueued.mutate(taskId),
      updateSession: (sessionId: string, startedAt: string, endedAt: string) =>
        updateSession.mutate({ sessionId, startedAt, endedAt }),
      deleteSession: (sessionId) => deleteSession.mutate(sessionId),
      reorder: (taskIds) => reorder.mutate(taskIds),
      complete: () => complete.mutate(),
      setMode,
      setGoalMinutes,
    },
    meta: {
      isCompleting: complete.isPending,
      isExecuting: executeTask.isPending,
      tracking,
      mode,
      goalMinutes,
      elapsedSeconds,
      shownSeconds,
    },
  };

  return (
    <ExecutionContext.Provider value={value}>
      {children}
    </ExecutionContext.Provider>
  );
}

export function useExecution() {
  const value = use(ExecutionContext);
  if (!value) throw new Error("useExecution must be used within ExecutionProvider");
  return value;
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

interface ExecutionContextValue {
  state: {
    session: ExecutionSession | null;
    tasks: ExecutionCurrent[];
    focused: ExecutionCurrent | null;
    queue: ExecutionQueueItem[];
    sessions: ExecutionSession[];
    isLoading: boolean;
    isPending: boolean;
    isError: boolean;
  };
  actions: {
    execute: (taskIds: string[]) => void;
    focus: (taskId: string) => void;
    pause: () => void;
    resume: () => void;
    removeQueued: (taskId: string) => void;
    updateSession: (sessionId: string, startedAt: string, endedAt: string) => void;
    deleteSession: (sessionId: string) => void;
    reorder: (taskIds: string[]) => void;
    complete: () => void;
    setMode: (mode: FocusMode) => void;
    setGoalMinutes: (minutes: number | null) => void;
  };
  meta: {
    isCompleting: boolean;
    isExecuting: boolean;
    tracking: boolean;
    mode: FocusMode;
    goalMinutes: number | null;
    elapsedSeconds: number;
    shownSeconds: number | null;
  };
}
