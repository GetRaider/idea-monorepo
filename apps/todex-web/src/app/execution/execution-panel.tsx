"use client";

import { useEffect, useState, type ReactNode } from "react";
import { formatEstimation, parseEstimation, TaskStatus } from "@repo/api/todex";
import type { ExecutionCurrent, ExecutionQueueTask } from "@repo/api/todex";
import { cn } from "@repo/ui";

import { STATUS_LABEL } from "../planning/task-helpers";
import { PriorityGlyph, StatusGlyph } from "../planning/task-board.ui";
import {
  formatSessionClock,
  sessionClockSeconds,
  sessionCompletion,
  sessionRingProgress,
  sessionTaskPhase,
  type ExecutionWorkPhase,
  type FocusMode,
} from "./execution-time";

export function ReadyExecutionPanel({
  tasks,
  goalMinutes,
  mode,
  canStart,
  focusModeOn,
  onFocusModeChange,
  onMode,
  onGoalMinutes,
  onRemove,
  onStart,
}: {
  tasks: ExecutionQueueTask[];
  goalMinutes: number | null;
  mode: FocusMode;
  canStart: boolean;
  focusModeOn: boolean;
  onFocusModeChange: (value: boolean) => void;
  onMode: (mode: FocusMode) => void;
  onGoalMinutes: (minutes: number | null) => void;
  onRemove: (taskId: string) => void;
  onStart: () => void;
}) {
  const totalMinutes = tasks.reduce(
    (total, task) => total + task.estimation,
    0,
  );

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-[#a3a3a0]">Goal (duration)</p>
          <div className="flex items-center gap-2">
            <GoalField minutes={goalMinutes} onMinutes={onGoalMinutes} />
            <ModeSwitch mode={mode} onMode={onMode} />
          </div>
          <div className="flex flex-wrap gap-2">
            {GOAL_PRESETS.map((preset) => (
              <PresetButton
                key={preset.minutes}
                label={preset.label}
                selected={goalMinutes === preset.minutes}
                onClick={() => onGoalMinutes(preset.minutes)}
              />
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-[#d7d7d4]">
          <span>
            Focus Mode <span className="ml-1 text-xs text-[#8f8f8c]">(on by default)</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-label="Start in Focus Mode"
            checked={focusModeOn}
            onChange={(event) => onFocusModeChange(event.target.checked)}
            className="size-4 accent-white"
          />
        </label>
        <WorkSummary
          items={[
            {
              icon: <CheckCardIcon />,
              value: `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`,
              caption: "Selected",
            },
            {
              icon: <LayersIcon />,
              value: formatEstimation(totalMinutes) || "0m",
              caption: "Total estimation",
            },
            {
              icon: <PersonIcon />,
              value: "Human",
              caption: "Execution mode",
            },
          ]}
        />
        <SelectedWorkHeader count={tasks.length} />
        {tasks.length === 0 ? (
          <p className="text-sm text-[#8f8f8c]">
            Select one or more tasks from the queue to start.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {tasks.map((task, index) => (
              <li
                key={task.id}
                className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-[#f2f2f0]">
                    <StatusGlyph status={task.status} />
                    <PriorityGlyph priority={task.priority} />
                    <span className="truncate">{index + 1}. {task.summary}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#8f8f8c]">
                    {workContext(task)} · {STATUS_LABEL[task.status]}
                  </p>
                </div>
                <EstimateChip minutes={task.estimation} />
                <RemoveButton
                  label={`Remove ${task.summary} from the queue`}
                  onClick={() => onRemove(task.id)}
                />
              </li>
            ))}
          </ol>
        )}
      </div>
      <footer className="flex flex-col gap-3 px-4 pb-4">
        <TotalRow minutes={totalMinutes} />
        <button
          type="button"
          disabled={!canStart}
          className="primary-noise flex h-11 items-center justify-center gap-2 rounded-lg bg-[#f2f2f0] text-sm font-medium text-[#0b0b0b] disabled:opacity-40"
          onClick={onStart}
        >
          <PlayIcon />
          Start Execution
        </button>
      </footer>
    </>
  );
}

export function RunningExecutionPanel({
  tasks,
  sessionTitle,
  tracking,
  mode,
  goalMinutes,
  elapsedSeconds,
  isCompleting,
  onOpen,
  onOpenTask,
  onPause,
  onResume,
  onFinish,
}: {
  tasks: ExecutionCurrent[];
  sessionTitle: string;
  tracking: boolean;
  mode: FocusMode;
  goalMinutes: number | null;
  elapsedSeconds: number;
  isCompleting: boolean;
  onOpen: () => void;
  onOpenTask: (taskId: string) => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
}) {
  const phases = tasks.map((task) => sessionTaskPhase(task.status));
  const completion = sessionCompletion(tasks);
  const totalMinutes = tasks.reduce(
    (total, task) => total + task.estimation,
    0,
  );
  const goalLabel = formatEstimation(goalMinutes);
  const clockSeconds = sessionClockSeconds({
    mode,
    elapsedSeconds,
    goalMinutes,
  });
  const estimateLabel = formatEstimation(totalMinutes) || "0m";

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-4 py-4">
        <div>
          <h3 className="truncate text-base font-semibold text-[#f2f2f0]">
            {sessionTitle}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#8f8f8c]">
            <PersonIcon />
            Human execution · {tasks.length}{" "}
            {tasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TimerRing
            label={formatSessionClock(clockSeconds)}
            caption={ringCaption(tracking, goalLabel, mode)}
            progress={sessionRingProgress({
              mode,
              elapsedSeconds,
              goalMinutes,
            })}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-[11px] font-medium tracking-[0.14em] text-[#8f8f8c]">
              WORK SUMMARY
            </p>
            <p className="font-mono text-2xl font-medium text-[#f2f2f0]">
              {completion.completed} / {completion.total}
            </p>
            <p className="text-xs text-[#8f8f8c]">Tasks completed</p>
            <p className="mt-2 text-sm text-[#d7d7d4]">{estimateLabel}</p>
            <p className="text-xs text-[#8f8f8c]">estimated</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium tracking-[0.14em] text-[#8f8f8c]">
            SESSION PROGRESS
          </p>
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#f2f2f0]"
                style={{ width: `${Math.round(completion.ratio * 100)}%` }}
              />
            </div>
            <span className="w-10 text-right font-mono text-xs text-[#cfcfcc]">
              {Math.round(completion.ratio * 100)}%
            </span>
          </div>
        </div>
        <SelectedWorkHeader count={tasks.length} />
        <ol className="flex flex-col gap-2">
          {tasks.map((task, index) => {
            const phase = phases[index] ?? "pending";
            return (
              <li key={task.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left",
                    phase === "in_progress"
                      ? "border border-white/25 bg-white/10"
                      : "border border-transparent bg-white/[0.03] hover:bg-white/[0.06]",
                  )}
                  onClick={() => onOpenTask(task.id)}
                >
                  <PhaseIcon phase={phase} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-[#f2f2f0]">
                      <StatusGlyph status={task.status} />
                      <PriorityGlyph priority={task.priority} />
                      <span className="truncate">{index + 1}. {task.summary}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#8f8f8c]">
                      {workContext(task)} ·{" "}
                      {workStatusLabel(phase, task.status)}
                    </span>
                  </span>
                  <EstimateChip minutes={task.estimation} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <footer className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] text-sm font-medium text-[#f2f2f0] hover:bg-white/10"
            onClick={() => (tracking ? onPause() : onResume())}
          >
            {tracking ? <PauseIcon /> : <PlayIcon />}
            {tracking ? "Pause" : "Resume"}
          </button>
          <button
            type="button"
            disabled={isCompleting}
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] text-sm font-medium text-[#f2f2f0] hover:bg-white/10 disabled:opacity-40"
            onClick={onFinish}
          >
            <FinishIcon />
            Finish
          </button>
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] text-sm font-medium text-[#f2f2f0] hover:bg-white/10"
            onClick={onOpen}
          >
            <OpenIcon />
            Open
          </button>
        </div>
      </footer>
    </>
  );
}

export function ExecutionModeSwitch() {
  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label="Execution mode"
    >
      <span
        className="flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-2.5 text-sm font-medium text-[#f2f2f0]"
        aria-current="true"
      >
        <PersonIcon />
        Human
      </span>
      <button
        type="button"
        disabled
        title="Coming later"
        className="flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg px-2.5 text-sm text-[#6f6f6c]"
      >
        <AgentIcon />
        AI Agent
        <LockIcon />
      </button>
    </div>
  );
}

function GoalField({
  minutes,
  onMinutes,
}: {
  minutes: number | null;
  onMinutes: (minutes: number | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    setDraft(null);
  }, [minutes]);

  return (
    <input
      aria-label="Goal duration"
      value={draft ?? (formatEstimation(minutes) || "")}
      placeholder="1h 30m"
      className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 font-mono text-sm text-[#f2f2f0] outline-none placeholder:text-[#6f6f6c] focus:border-white/25"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft == null) return;
        const next = commitGoal(draft);
        setDraft(null);
        if (next === undefined) return;
        onMinutes(next);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}

function ModeSwitch({
  mode,
  onMode,
}: {
  mode: FocusMode;
  onMode: (mode: FocusMode) => void;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <ModeButton
        label="Timer"
        selected={mode === "timer"}
        icon={<TimerIcon />}
        onClick={() => onMode("timer")}
      />
      <ModeButton
        label="Stopwatch"
        selected={mode === "stopwatch"}
        icon={<StopwatchIcon />}
        onClick={() => onMode("stopwatch")}
      />
    </div>
  );
}

function ModeButton({
  label,
  selected,
  icon,
  onClick,
}: {
  label: string;
  selected: boolean;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm",
        selected
          ? "border-white/15 bg-white/10 text-[#f2f2f0]"
          : "border-transparent text-[#8f8f8c] hover:bg-white/[0.04] hover:text-[#f2f2f0]",
      )}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function PresetButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "flex h-8 items-center rounded-lg border px-3 text-sm",
        selected
          ? "border-white/20 bg-white/10 text-[#f2f2f0]"
          : "border-white/10 bg-white/[0.03] text-[#cfcfcc] hover:bg-white/[0.06]",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function WorkSummary({
  items,
}: {
  items: Array<{ icon: ReactNode; value: string; caption: string }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-[#f2f2f0]">Work Summary</h3>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div
            key={item.caption}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.04] px-2 py-3 text-center"
          >
            <span className="text-[#cfcfcc]">{item.icon}</span>
            <span className="text-sm font-medium text-[#f2f2f0]">
              {item.value}
            </span>
            <span className="text-xs text-[#8f8f8c]">{item.caption}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectedWorkHeader({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-[#f2f2f0]">Selected Work</h3>
      <span className="text-xs text-[#8f8f8c]">
        {count} {count === 1 ? "task" : "tasks"}
      </span>
    </div>
  );
}

function TotalRow({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-sm">
      <span className="text-[#a3a3a0]">Total estimation</span>
      <span className="font-mono text-[#f2f2f0]">
        {formatEstimation(minutes) || "0m"}
      </span>
    </div>
  );
}

function EstimateChip({ minutes }: { minutes: number }) {
  return (
    <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-[#cfcfcc]">
      {formatEstimation(minutes) || "—"}
    </span>
  );
}

function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#a3a3a0] hover:bg-white/10 hover:text-[#f2f2f0]"
      onClick={onClick}
    >
      <CloseIcon />
    </button>
  );
}

function PhaseIcon({ phase }: { phase: ExecutionWorkPhase }) {
  if (phase === "completed") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#1f8f5f] text-[#04140c]">
        <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
          <path
            d="M3.5 8.2 6.4 11l6.1-6.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (phase === "in_progress") {
    return (
      <span
        className="flex size-5 shrink-0 animate-spin items-center justify-center rounded-full border-2 border-[#f2f2f0] border-t-transparent"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="size-5 shrink-0 rounded-full border border-white/25"
      aria-hidden
    />
  );
}

function TimerRing({
  label,
  caption,
  progress,
}: {
  label: string;
  caption: string;
  progress: number;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = Math.max(0, Math.min(1, progress)) * circumference;

  return (
    <div
      className="relative flex size-36 shrink-0 items-center justify-center"
      role="timer"
      aria-label={`${label} ${caption}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#f2f2f0"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-mono text-xl font-medium leading-none tracking-tight text-[#f2f2f0]">
          {label}
        </p>
        <p className="text-xs text-[#a3a3a0]">{caption}</p>
      </div>
    </div>
  );
}

function ringCaption(tracking: boolean, goalLabel: string, mode: FocusMode) {
  const detail = ringDetail(goalLabel, mode);
  if (!tracking) return `Paused · ${detail}`;
  return detail;
}

function ringDetail(goalLabel: string, mode: FocusMode) {
  if (goalLabel) return `of ${goalLabel}`;
  if (mode === "stopwatch") return "Stopwatch";
  return "Timer";
}

function commitGoal(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseEstimation(trimmed);
  if (parsed == null || parsed <= 0) return undefined;
  return Math.min(24 * 60, parsed);
}

function workContext(task: {
  spaceName: string;
  sectionName: string;
  isDefaultSection: boolean;
}) {
  return task.isDefaultSection ? task.spaceName : task.sectionName;
}

function workStatusLabel(
  phase: ExecutionWorkPhase,
  status: ExecutionQueueTask["status"],
) {
  if (phase === "in_progress") return "In Progress";
  if (phase === "completed" && status === TaskStatus.DONE) return "Completed";
  return STATUS_LABEL[status];
}

function CheckCardIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M5 8.1 7 10l4-4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path
        d="M8 2.5 13 5.5 8 8.5 3 5.5 8 2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M3 8 8 11l5-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 10.5 8 13.5l5-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <circle
        cx="8"
        cy="5.2"
        r="2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M3.5 13.2c.6-2.2 2.3-3.3 4.5-3.3s3.9 1.1 4.5 3.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AgentIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <circle
        cx="8"
        cy="6"
        r="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M4.2 12.5c.5-1.8 1.9-2.7 3.8-2.7s3.3.9 3.8 2.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M11.2 2.2 12 3.6l1.4.2-1.1 1 .3 1.4-1.4-.8-1.4.8.3-1.4-1.1-1 1.4-.2.8-1.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
      <rect
        x="3.5"
        y="7"
        width="9"
        height="6.5"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <circle
        cx="8"
        cy="9"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M8 6.5V9l2 1.2M6.5 2.5h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopwatchIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <circle
        cx="8"
        cy="9"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M8 9V6.5M8 2.2v1.6M6.4 2.2h3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path d="M5.5 3.5v9l7-4.5-7-4.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path d="M5 3.5h2v9H5zM9 3.5h2v9H9z" fill="currentColor" />
    </svg>
  );
}

function OpenIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path
        d="M6 3.5H3.5v9h9V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 3.5H12.5V7.5M12.2 3.8 7.5 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FinishIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path
        d="M3.5 8.2 6.4 11l6.1-6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path
        d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const GOAL_PRESETS = [
  { minutes: 25, label: "25m" },
  { minutes: 50, label: "50m" },
  { minutes: 60, label: "1h" },
  { minutes: 120, label: "2h" },
] as const;
