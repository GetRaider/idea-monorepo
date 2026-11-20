"use client";

import { useState } from "react";
import Link from "next/link";
import { formatEstimation, TaskStatus } from "@repo/api/todex";
import type { ExecutionCurrent } from "@repo/api/todex";
import { PauseIcon } from "@components/icons";

import { STATUS_LABEL, taskProgressPercent } from "../planning/task-helpers";
import { PriorityGlyph, StatusGlyph } from "../planning/task-board.ui";
import { ExecutionTaskDetails } from "./execution-task-details";
import {
  formatDuration,
  formatSessionClock,
  sessionRingProgress,
  type FocusMode,
} from "./execution-time";

interface ExecutionWorkspaceViewProps {
  sessionTitle: string;
  tasks: ExecutionCurrent[];
  selectedTask: ExecutionCurrent | null;
  mode: FocusMode;
  goalMinutes: number | null;
  elapsedSeconds: number;
  clockSeconds: number;
  tracking: boolean;
  isCompleting: boolean;
  onSelectTask: (taskId: string) => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onEnterFocus: () => void;
  onExtend: (minutes: number) => void;
}

export function ExecutionWorkspaceView({
  sessionTitle,
  tasks,
  selectedTask,
  mode,
  goalMinutes,
  elapsedSeconds,
  clockSeconds,
  tracking,
  isCompleting,
  onSelectTask,
  onPause,
  onResume,
  onFinish,
  onEnterFocus,
  onExtend,
}: ExecutionWorkspaceViewProps) {
  const [queueVisible, setQueueVisible] = useState(true);
  const completed = tasks.filter((task) => task.status === TaskStatus.DONE).length;
  const estimate = tasks.reduce((total, task) => total + task.estimation, 0);
  const progress = sessionRingProgress({ mode, elapsedSeconds, goalMinutes });
  const goalReached =
    mode === "timer" &&
    goalMinutes != null &&
    goalMinutes > 0 &&
    elapsedSeconds >= goalMinutes * 60;
  const showQueue = tasks.length > 1 && queueVisible;

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <Link href="/execution" className="shrink-0 text-[#9b9b99] hover:text-[#f2f2f0]">
              Execution
            </Link>
            <span className="text-[#777774]">›</span>
            <h1 className="min-w-0 truncate text-[#f2f2f0]" suppressHydrationWarning>
              {sessionTitle}
            </h1>
          </div>
          <p className="mt-2 text-sm text-[#999996]">
            Human execution · {tasks.length} {tasks.length === 1 ? "task" : "tasks"} · {mode === "timer" ? "Timer" : "Stopwatch"}
            {!tracking ? " · Paused" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tasks.length > 1 ? (
            <button
              type="button"
              aria-expanded={showQueue}
              onClick={() => setQueueVisible((visible) => !visible)}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-[#d7d7d4] hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              {showQueue ? "Hide tasks" : "Show tasks"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onEnterFocus}
            role="switch"
            aria-checked={false}
            className="rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-[#f2f2f0] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Focus Mode: Off
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-white/10 bg-[#141414] px-5 py-5 sm:px-7 sm:py-6" aria-label="Execution session timer">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
          <div className="min-w-[200px] flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#999996]">
              {mode === "timer" ? "Time remaining" : "Elapsed time"}
            </p>
            <div role="timer" aria-label={mode === "timer" ? "Time remaining" : "Elapsed session time"} className="mt-1 font-mono text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-tight tracking-tight tabular-nums text-[#f4f4f2]">
              {formatSessionClock(clockSeconds)}
            </div>
            <p className="text-sm text-[#a3a3a0]">
              {formatDuration(elapsedSeconds)} focused
              {goalMinutes != null ? " · " + formatEstimation(goalMinutes) + " goal" : ""}
            </p>
            {mode === "timer" && goalMinutes != null && goalMinutes > 0 ? (
              <div
                role="progressbar"
                aria-label="Session duration progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                className="mt-4 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/10"
              >
                <div className="h-full rounded-full bg-[#d7d7d4] transition-[width] duration-1000" style={{ width: String(Math.round(progress * 100)) + "%" }} />
              </div>
            ) : null}
          </div>

          <div className="flex min-w-40 items-center gap-7">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#999996]">Tasks completed</p>
              <p className="mt-1 text-2xl font-semibold text-[#f2f2f0]">
                {completed}<span className="text-[#898986]">/{tasks.length}</span>
              </p>
              <p className="mt-1 text-xs text-[#999996]">{formatEstimation(estimate) || "0m"} estimated</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={tracking ? onPause : onResume}
              className="flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 text-sm font-medium text-[#f2f2f0] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              {tracking ? <PauseIcon size={16} /> : <PlayMark />}
              {tracking ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              disabled={isCompleting}
              onClick={onFinish}
              className="h-11 rounded-xl bg-[#f4f4f1] px-5 text-sm font-semibold text-[#111] hover:bg-white/85 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Finish
            </button>
          </div>
        </div>
      </section>

      {goalReached ? (
        <section role="status" aria-label="Time goal reached" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/[0.05] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#f2f2f0]">Your time goal is complete.</p>
            <p className="mt-0.5 text-xs text-[#a3a3a0]">Extend the session or finish. Unfinished tasks will remain as they are.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onExtend(15)} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-[#f2f2f0] hover:bg-white/10">
              +15m
            </button>
            <button type="button" onClick={() => onExtend(30)} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-[#f2f2f0] hover:bg-white/10">
              +30m
            </button>
            <button type="button" onClick={onFinish} disabled={isCompleting} className="rounded-lg bg-[#f4f4f1] px-3 py-2 text-sm font-medium text-[#111] disabled:opacity-40">
              Finish session
            </button>
          </div>
        </section>
      ) : null}

      <div className={showQueue ? "grid min-w-0 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]" : "min-w-0"}>
        {showQueue ? (
          <aside className="min-w-0 self-start rounded-2xl border border-white/10 bg-[#141414] p-3" aria-label="Session tasks">
            <div className="flex items-center justify-between px-2 pb-3 pt-1">
              <h2 className="text-sm font-semibold text-[#f2f2f0]">Tasks</h2>
              <span className="text-xs text-[#9b9b99]">{completed}/{tasks.length} completed</span>
            </div>
            <ol className="flex flex-col gap-2">
              {tasks.map((task, index) => {
                const selected = selectedTask?.id === task.id;
                const isDone = task.status === TaskStatus.DONE;
                const taskProgress = taskProgressPercent({
                  status: task.status,
                  acceptanceCriteria: task.acceptanceCriteria,
                  subtasks: task.subtasks,
                });
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelectTask(task.id)}
                      className={
                        "w-full rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white " +
                        (selected
                          ? "border-white/60 bg-white/[0.08]"
                          : "border-white/[0.07] bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]")
                      }
                    >
                      <span className="flex items-start gap-2">
                        <span aria-hidden className="mt-0.5 text-xs text-[#999996]">{index + 1}.</span>
                        <span className="min-w-0 flex-1">
                          <span className={"flex items-start gap-1.5 break-words text-sm font-medium " + (isDone ? "text-[#999996] line-through" : "text-[#f2f2f0]")}>
                            <StatusGlyph status={task.status} />
                            <PriorityGlyph priority={task.priority} />
                            <span>{task.summary}</span>
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#999996]">
                            <span>{STATUS_LABEL[task.status]}</span>
                            <span>·</span>
                            <span>{formatEstimation(task.estimation) || "—"}</span>
                          </span>
                          <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10">
                            <span className="block h-full rounded-full bg-[#d7d7d4]" style={{ width: String(Math.round(taskProgress * 100)) + "%" }} />
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>
        ) : null}

        <div className="min-w-0">
          {selectedTask ? (
            <div className="flex flex-col gap-3">
              <ExecutionTaskDetails key={selectedTask.id} task={selectedTask} />
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 p-5 text-sm text-[#a3a3a0]">No tasks in this execution session.</p>
          )}
        </div>
      </div>
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
