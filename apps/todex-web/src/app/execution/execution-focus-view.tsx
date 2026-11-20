"use client";

import { formatEstimation, TaskStatus } from "@repo/api/todex";
import type { ExecutionCurrent } from "@repo/api/todex";
import { PauseIcon } from "@components/icons";

import { STATUS_LABEL, taskProgressPercent } from "../planning/task-helpers";
import {
  formatDuration,
  formatSessionClock,
  sessionRingProgress,
  type FocusMode,
} from "./execution-time";

interface ExecutionFocusViewProps {
  sessionTitle: string;
  tasks: ExecutionCurrent[];
  activeTask: ExecutionCurrent | null;
  mode: FocusMode;
  goalMinutes: number | null;
  clockSeconds: number;
  elapsedSeconds: number;
  tracking: boolean;
  isCompleting: boolean;
  completedTasks: number;
  onExit: () => void;
  onOpenDetails: (taskId: string) => void;
  onSwitchTask: (taskId: string) => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onExtend: (minutes: number) => void;
}

export function ExecutionFocusView({
  sessionTitle,
  tasks,
  activeTask,
  mode,
  goalMinutes,
  clockSeconds,
  elapsedSeconds,
  tracking,
  isCompleting,
  completedTasks,
  onExit,
  onOpenDetails,
  onSwitchTask,
  onPause,
  onResume,
  onFinish,
  onExtend,
}: ExecutionFocusViewProps) {
  const goalReached =
    mode === "timer" &&
    goalMinutes != null &&
    elapsedSeconds >= goalMinutes * 60;
  const progress = sessionRingProgress({
    mode,
    elapsedSeconds,
    goalMinutes,
  });
  const taskProgress = activeTask
    ? taskProgressPercent({
        status: activeTask.status,
        acceptanceCriteria: activeTask.acceptanceCriteria,
        subtasks: activeTask.subtasks,
      })
    : 0;

  return (
    <div className="relative isolate flex min-h-[560px] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10]">
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-13rem] left-1/2 -z-10 size-[36rem] -translate-x-1/2 rounded-full bg-violet-500/[0.08] blur-[100px]"
      />
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#94949c]">
            Focus Mode
          </p>
          <p className="mt-1 truncate text-sm text-[#b1b1b7]">
            {sessionTitle}
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-[#f2f2f0] transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={onExit}
        >
          Exit Focus
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-10 text-center sm:px-8">
        <div className="mb-7 w-full max-w-xl">
          {tasks.length > 1 ? (
            <select
              aria-label="Current execution task"
              value={activeTask?.id ?? ""}
              onChange={(event) => onSwitchTask(event.target.value)}
              className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#19191c] px-4 py-3 text-center text-base font-medium text-[#f2f2f0] outline-none focus-visible:border-white/40"
            >
              {tasks.map((task) => (
                <option
                  key={task.id}
                  value={task.id}
                  disabled={
                    task.status === TaskStatus.DONE &&
                    task.id !== activeTask?.id
                  }
                >
                  {task.summary}
                  {task.status === TaskStatus.DONE ? " · Done" : ""}
                </option>
              ))}
            </select>
          ) : (
            <h1 className="truncate text-xl font-semibold tracking-tight text-[#f2f2f0] sm:text-2xl">
              {activeTask?.summary ?? "Execution session"}
            </h1>
          )}
          {activeTask ? (
            <p className="mt-3 text-sm text-[#8f8f97]">
              {activeTask.spaceName} · {STATUS_LABEL[activeTask.status]}
            </p>
          ) : null}
        </div>

        <div
          role="timer"
          aria-label={mode === "timer" ? "Time remaining" : "Elapsed time"}
          className="font-mono text-[clamp(4rem,11vw,9.5rem)] font-light leading-none tracking-[-0.075em] tabular-nums text-[#f4f4f2]"
        >
          {formatSessionClock(clockSeconds)}
        </div>
        <p className="mt-5 text-sm text-[#9c9ca4]">
          {goalReached
            ? "Time is up — you can continue or finish"
            : mode === "timer"
              ? `Remaining of ${formatEstimation(goalMinutes) || "your session"}`
              : "Elapsed session time"}
          {!tracking ? " · Paused" : ""}
        </p>

        {mode === "timer" && goalMinutes != null && goalMinutes > 0 ? (
          <div
            role="progressbar"
            aria-label="Session time elapsed"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="mt-7 h-1 w-full max-w-80 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-[#c4b5fd] transition-[width] duration-1000"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        ) : null}

        {goalReached ? (
          <div role="status" className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-4">
            <p className="text-sm font-medium text-[#f2f2f0]">Your time goal is complete.</p>
            <p className="text-xs text-[#9c9ca4]">Extend your session, or finish when ready.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => onExtend(15)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-[#f2f2f0] hover:bg-white/10">
                +15m
              </button>
              <button type="button" onClick={() => onExtend(30)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-[#f2f2f0] hover:bg-white/10">
                +30m
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="flex h-12 min-w-32 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 text-sm font-medium text-[#f2f2f0] transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={tracking ? onPause : onResume}
          >
            {tracking ? <PauseIcon size={16} /> : <PlayMark />}
            {tracking ? "Pause" : "Resume"}
          </button>
          <button
            type="button"
            disabled={isCompleting}
            className="flex h-12 min-w-32 items-center justify-center rounded-xl bg-[#f4f4f1] px-6 text-sm font-semibold text-[#111] transition-colors hover:bg-white/85 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={onFinish}
          >
            Finish
          </button>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-3xl px-5 pb-7 sm:px-8">
        {activeTask ? (
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-[#f2f2f0]">
                  {activeTask.summary}
                </p>
                <p className="mt-1 text-xs text-[#94949c]">
                  Task progress · {Math.round(taskProgress * 100)}%
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-[#f2f2f0] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                onClick={() => onOpenDetails(activeTask.id)}
              >
                Task details
              </button>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#d7d7d4]"
                style={{ width: `${Math.round(taskProgress * 100)}%` }}
              />
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-xs text-[#8f8f97]">
          <span>{formatDuration(elapsedSeconds)} active time</span>
          <span>
            {completedTasks}/{tasks.length} tasks completed
          </span>
          <span>
            {formatEstimation(
              tasks.reduce((total, task) => total + task.estimation, 0),
            ) || "0m"}{" "}
            estimated work
          </span>
        </div>
      </footer>
    </div>
  );
}

function PlayMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path d="M5.5 3.5v9l7-4.5-7-4.5z" fill="currentColor" />
    </svg>
  );
}
