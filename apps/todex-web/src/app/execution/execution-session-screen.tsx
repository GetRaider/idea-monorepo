"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatEstimation } from "@repo/api/todex";
import type { ExecutionCurrent } from "@repo/api/todex";
import { ConfirmDialog, Spinner, cn } from "@repo/ui";

import { OverviewIcon, PauseIcon } from "@components/icons";

import { taskProgressPercent, STATUS_LABEL } from "../planning/task-helpers";
import { useExecution } from "./execution-provider";
import { ExecutionTaskDetails } from "./execution-task-details";
import { ExecutionFocusView } from "./execution-focus-view";
import { readSelectedTask, writeSelectedTask } from "./execution-selection";
import {
  executionSessionTitle,
  formatDuration,
  formatSessionClock,
  selectedSessionTaskId,
  sessionClockSeconds,
  sessionCompletion,
  sessionRingProgress,
  sessionTaskPhase,
  type ExecutionWorkPhase,
} from "./execution-time";

export function ExecutionSessionScreen() {
  return (
    <Suspense fallback={<Spinner className="flex-1" />}>
      <SessionScreenBody />
    </Suspense>
  );
}

function SessionScreenBody() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    state: { session, tasks, focused, isLoading },
    actions: { focus, pause, resume, complete },
    meta: { tracking, mode, goalMinutes, sessionElapsedSeconds, isCompleting },
  } = useExecution();
  const [finishOpen, setFinishOpen] = useState(false);
  const isFocusView = params.get("view") === "focus";
  const [stored, setStored] = useState<StoredSelection | null>(null);
  const [pickedTaskId, setPickedTaskId] = useState<string | null | undefined>(
    undefined,
  );
  const selectedId = session
    ? selectedSessionTaskId({
        sessionId: session.id,
        queryTaskId: params.get("task"),
        storedSessionId: stored?.sessionId ?? null,
        storedTaskId: stored?.taskId ?? null,
        taskIds: tasks.map((task) => task.id),
      })
    : null;
  const visibleTaskId = pickedTaskId === undefined ? selectedId : pickedTaskId;

  useEffect(() => {
    setStored(readSelectedTask());
    setPickedTaskId(undefined);
  }, [session?.id]);

  useEffect(() => {
    if (isLoading || session) return;
    router.replace("/execution");
  }, [isLoading, session, router]);

  function setFocusView(enabled: boolean) {
    const next = new URLSearchParams(params.toString());
    if (enabled) next.set("view", "focus");
    else next.delete("view");
    router.replace(`/execution/session${next.size ? `?${next.toString()}` : ""}`);
  }

  function select(taskId: string | null) {
    if (!session) return;
    setPickedTaskId(taskId);
    writeSelectedTask(session.id, taskId);
    const href = taskId
      ? `/execution/session?task=${encodeURIComponent(taskId)}`
      : "/execution/session";
    router.replace(href);
  }

  if (!session) return <Spinner className="flex-1" />;

  const completion = sessionCompletion(tasks);
  const totalMinutes = tasks.reduce(
    (total, task) => total + task.estimation,
    0,
  );
  const selected = tasks.find((task) => task.id === visibleTaskId) ?? null;
  const activeTask = focused ?? selected ?? tasks.find((task) => task.status !== "DONE") ?? tasks[0] ?? null;
  const sessionTitle = executionSessionTitle({
    startedAt: session.startedAt,
    spaceName: tasks[0]?.spaceName ?? null,
  });
  const goalLabel = formatEstimation(goalMinutes);
  const clockSeconds = sessionClockSeconds({
    mode,
    elapsedSeconds: sessionElapsedSeconds,
    goalMinutes,
  });

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 pb-6 pt-3">
      {isFocusView ? (
        <ExecutionFocusView
          sessionTitle={sessionTitle}
          tasks={tasks}
          activeTask={activeTask}
          mode={mode}
          goalMinutes={goalMinutes}
          clockSeconds={clockSeconds}
          elapsedSeconds={sessionElapsedSeconds}
          tracking={tracking}
          isCompleting={isCompleting}
          completedTasks={completion.completed}
          onExit={() => setFocusView(false)}
          onOpenDetails={(taskId) => select(taskId)}
          onSwitchTask={(taskId) => {
            if (taskId && taskId !== focused?.id) focus(taskId);
          }}
          onPause={pause}
          onResume={resume}
          onFinish={() => setFinishOpen(true)}
        />
      ) : (
        <>
      <div className="mb-4 flex min-w-0 items-center gap-3 text-2xl font-semibold tracking-tight">
        <Link
          href="/execution"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          Execution
        </Link>
        <span className="shrink-0 text-muted-foreground">›</span>
        {selected ? (
          <button
            type="button"
            className="min-w-0 truncate text-muted-foreground hover:text-foreground"
            onClick={() => select(null)}
          >
            <span suppressHydrationWarning>{sessionTitle}</span>
          </button>
        ) : (
          <span className="truncate" suppressHydrationWarning>
            {sessionTitle}
          </span>
        )}
        {selected ? (
          <>
            <span className="shrink-0 text-muted-foreground">›</span>
            <span className="truncate">{selected.taskKey}</span>
          </>
        ) : null}
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-sm text-[#a3a3a0]">
        <PersonMark />
        Human execution · {tasks.length} {tasks.length === 1 ? "task" : "tasks"}{" "}
        · {mode === "timer" ? "Timer" : "Stopwatch"}
        {tracking ? "" : " · Paused"}
      </p>
      <button
        type="button"
        onClick={() => setFocusView(true)}
        className="rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-medium text-[#f2f2f0] transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Focus Mode
      </button>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-white/10 bg-[#141414] px-5 py-4">
        <TimerReadout
          label={formatSessionClock(clockSeconds)}
          caption={
            goalLabel
              ? `of ${goalLabel}`
              : mode === "timer"
                ? "Timer"
                : "Stopwatch"
          }
          progress={sessionRingProgress({
            mode,
            elapsedSeconds: sessionElapsedSeconds,
            goalMinutes,
          })}
        />
        <div className="hidden h-16 w-px bg-white/10 sm:block" />
        <div className="min-w-56">
          <p className="text-[11px] font-medium tracking-[0.16em] text-[#8d8d8a]">
            SESSION PROGRESS
          </p>
          <p className="mt-2 flex items-baseline gap-2 leading-none">
            <span className="text-[28px] font-semibold tracking-tight text-[#f2f2f0]">
              {completion.completed}
              <span className="text-[#8d8d8a]">/{completion.total}</span>
            </span>
            <span className="text-sm text-[#8d8d8a]">tasks completed</span>
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#d7d7d4]"
              style={{ width: `${Math.round(completion.ratio * 100)}%` }}
            />
          </div>
        </div>
        <div className="hidden h-16 w-px bg-white/10 sm:block" />
        <div className="min-w-36">
          <p className="text-[11px] font-medium tracking-[0.16em] text-[#8d8d8a]">
            TOTAL ESTIMATION
          </p>
          <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-[#f2f2f0]">
            {formatEstimation(totalMinutes) || "0m"}
          </p>
          <p className="mt-1 text-sm text-[#8d8d8a]">
            {formatDuration(sessionElapsedSeconds)} active time
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm text-[#f2f2f0] hover:bg-white/10"
            onClick={() => (tracking ? pause() : resume())}
          >
            {tracking ? <PauseIcon size={16} /> : <PlayMark />}
            {tracking ? "Pause" : "Resume"}
          </button>
          <button
            type="button"
            disabled={isCompleting}
            className="flex h-11 items-center gap-2 rounded-xl bg-[#f4f4f1] px-4 text-sm font-medium text-[#111] disabled:opacity-40"
            onClick={() => setFinishOpen(true)}
          >
            <CheckMark />
            Finish
          </button>
        </div>
      </div>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-base font-semibold text-[#f2f2f0]">Scope</h2>
        <span className="text-sm text-[#8d8d8a]">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"} ·{" "}
          {formatEstimation(totalMinutes) || "0m"} estimated
        </span>
      </div>
      <div className="mb-5 flex gap-3 overflow-x-auto pb-1">
        <button
          type="button"
          className={cardClass(selected == null)}
          onClick={() => select(null)}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#d7d7d4]">
            <OverviewIcon size={15} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-[#f2f2f0]">
              Overview
            </span>
            <span className="block text-xs text-[#8d8d8a]">
              Session details
            </span>
          </span>
        </button>
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            className={cardClass(task.id === selected?.id, true)}
            onClick={() => select(task.id)}
          >
            <TaskCardBody task={task} />
          </button>
        ))}
      </div>
      {selected ? (
        <ExecutionTaskDetails task={selected} />
      ) : (
        <WorkBreakdown tasks={tasks} onView={(taskId) => select(taskId)} />
      )}
        </>
      )}
      {finishOpen ? (
        <ConfirmDialog
          title="Finish execution"
          description="Unfinished tasks stay as they are. This session is saved to History."
          confirmLabel="Finish"
          onConfirm={() => complete()}
          onClose={() => setFinishOpen(false)}
        />
      ) : null}
    </section>
  );
}

function WorkBreakdown({
  tasks,
  onView,
}: {
  tasks: ExecutionCurrent[];
  onView: (taskId: string) => void;
}) {
  const total = tasks.reduce((sum, task) => sum + task.estimation, 0);

  return (
    <section className="rounded-xl border border-white/[0.06] bg-[#121212] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-[#f2f2f0]">
          Work Breakdown
        </h3>
        <span className="text-xs text-[#8f8f8c]">
          {formatEstimation(total) || "0m"} estimated
        </span>
      </div>
      <ul className="flex flex-col">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 border-t border-white/[0.06] py-3"
          >
            <PhaseDot phase={sessionTaskPhase(task.status)} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-[#f2f2f0]">
                {task.summary}
              </span>
              <span className="text-xs text-[#8f8f8c]">
                {contextLabel(task)} · {STATUS_LABEL[task.status]}
              </span>
            </span>
            <span className="font-mono text-xs text-[#cfcfcc]">
              {formatEstimation(task.estimation) || "—"}
            </span>
            <button
              type="button"
              className="h-8 rounded-md border border-white/10 px-3 text-sm text-[#e6e6e3] hover:bg-white/10"
              onClick={() => onView(task.id)}
            >
              View
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TaskCardBody({ task }: { task: ExecutionCurrent }) {
  const progress = taskProgressPercent({
    status: task.status,
    acceptanceCriteria: task.acceptanceCriteria,
    subtasks: task.subtasks,
  });
  const phase = sessionTaskPhase(task.status);
  const width = phase === "in_progress" ? Math.max(progress, 0.08) : progress;

  return (
    <>
      <span className="flex w-full items-center gap-2">
        <PhaseDot phase={phase} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#f2f2f0]">
          {task.summary}
        </span>
        <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-[#cfcfcc]">
          {formatEstimation(task.estimation) || "—"}
        </span>
      </span>
      <span className="pl-6 text-xs text-[#8d8d8a]">
        {contextLabel(task)} · {STATUS_LABEL[task.status]}
      </span>
      <span className="mt-auto block h-1 w-full overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full bg-[#d7d7d4]"
          style={{ width: `${Math.round(width * 100)}%` }}
        />
      </span>
    </>
  );
}

function TimerReadout({
  label,
  caption,
  progress,
}: {
  label: string;
  caption: string;
  progress: number;
}) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const dash = Math.max(0, Math.min(1, progress)) * circumference;

  return (
    <div
      className="relative flex size-40 shrink-0 items-center justify-center"
      role="timer"
    >
      <svg
        viewBox="0 0 80 80"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#f2f2f0"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <span className="text-center">
        <span className="block font-mono text-xl font-medium text-[#f2f2f0]">
          {label}
        </span>
        <span className="block text-[11px] text-[#8d8d8a]">{caption}</span>
      </span>
    </div>
  );
}

function PhaseDot({ phase }: { phase: ExecutionWorkPhase }) {
  if (phase === "completed") {
    return (
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#1f8f5f] text-[#04140c]">
        <CheckMark />
      </span>
    );
  }
  if (phase === "in_progress") {
    return (
      <svg viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0" aria-hidden>
        <circle
          cx="8"
          cy="8"
          r="5.5"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.6"
        />
        <circle
          cx="8"
          cy="8"
          r="5.5"
          fill="none"
          stroke="#c4b5fd"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="8 26"
          transform="rotate(-90 8 8)"
        />
      </svg>
    );
  }
  return (
    <span className="mt-0.5 size-4 shrink-0 rounded-full border border-white/30" />
  );
}

function PlayMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
      <path d="M5.5 3.5v9l7-4.5-7-4.5z" fill="currentColor" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
      <path
        d="M3.5 8.2 6.4 11l6.1-6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <circle
        cx="8"
        cy="5.2"
        r="2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M3.6 13c.6-2.1 2.2-3.1 4.4-3.1s3.8 1 4.4 3.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function cardClass(selected: boolean, stacked = false) {
  return cn(
    "h-[92px] w-[280px] shrink-0 rounded-2xl border bg-[#141414] px-3.5 py-3 text-left",
    stacked
      ? "flex flex-col items-stretch justify-center gap-1.5"
      : "flex items-center gap-3",
    selected ? "border-white/80" : "border-white/10 hover:border-white/25",
  );
}

function contextLabel(task: ExecutionCurrent) {
  return task.isDefaultSection ? task.spaceName : task.sectionName;
}

interface StoredSelection {
  sessionId: string;
  taskId: string | null;
}
