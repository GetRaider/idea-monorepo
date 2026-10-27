"use client";

import { useEffect, useRef, useState } from "react";
import { formatEstimation } from "@repo/api/todex";
import type { ExecutionCurrent } from "@repo/api/todex";
import { Button, Spinner, cn } from "@repo/ui";

import {
  applyTaskSelection,
  isToggleClick,
} from "../../planning/task-selection";
import { useExecution } from "../execution-provider";
import { ExecutionQueueList } from "../execution-queue-list";
import { ExecutionCanvas } from "../execution-sidebar";
import { ExecutionSuggestionsPanel } from "../execution-suggestions-panel";
import { ExecutionTaskDetail } from "../execution-task-detail";
import {
  extendGoalMinutes,
  formatClock,
  formatDuration,
} from "../execution-time";

export default function CurrentExecutionPage() {
  const {
    state: { session, tasks, focused, queue, isLoading, isError },
    actions: { execute, removeQueued, setMode, setGoalMinutes },
    meta: { isExecuting },
  } = useExecution();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [mixedBoard, setMixedBoard] = useState(false);
  const [preset, setPreset] = useState<DurationPreset>(null);
  const pendingPreset = useRef<DurationPreset>(null);
  const orderedSelected = queue
    .map((item) => item.taskId)
    .filter((taskId) => selectedIds.includes(taskId));
  const scheduledMinutes = queue.reduce(
    (total, item) => total + item.task.estimation,
    0,
  );
  const startIds =
    orderedSelected.length > 0
      ? orderedSelected
      : queue.map((item) => item.taskId);
  const startBoards = new Set(
    queue
      .filter((item) => startIds.includes(item.taskId))
      .map((item) => item.task.spaceId),
  );
  const canStart = startIds.length > 0 && startBoards.size <= 1 && !isExecuting;

  useEffect(() => {
    if (!session) return;
    const chosen = pendingPreset.current;
    if (chosen == null) return;
    pendingPreset.current = null;
    if (chosen === "none") {
      setMode("stopwatch");
      setGoalMinutes(null);
      return;
    }
    setMode("timer");
    setGoalMinutes(chosen);
  }, [session, setGoalMinutes, setMode]);

  function start() {
    if (!canStart) return;
    pendingPreset.current = preset;
    execute(startIds);
  }

  function selectQueued(
    taskId: string,
    event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
  ) {
    const next = applyTaskSelection({
      selectedIds: new Set(orderedSelected),
      anchorId: anchorId ?? orderedSelected[0] ?? null,
      taskId,
      orderedIds: queue.map((item) => item.taskId),
      shift: event.shiftKey,
      toggle: isToggleClick(event, navigator.platform),
    });
    const selected = queue.filter((item) => next.selectedIds.has(item.taskId));
    const boards = new Set(selected.map((item) => item.task.spaceId));
    if (boards.size > 1) {
      setMixedBoard(true);
      return;
    }
    setMixedBoard(false);
    setAnchorId(next.anchorId);
    setSelectedIds([...next.selectedIds]);
  }

  const scheduledLabel = formatEstimation(scheduledMinutes) || "0m";

  return (
    <ExecutionCanvas
      title="Execution"
      actions={
        <div className="flex gap-2">
          <StatChip value={String(queue.length)} label="in queue" />
          <StatChip value={scheduledLabel} label="scheduled" />
        </div>
      }
    >
      {isLoading ? (
        <Spinner className="flex-1" />
      ) : isError ? (
        <p className="text-sm text-[#8f8f8c]">Could not load execution.</p>
      ) : (
        <div className="flex min-h-0 flex-1 gap-3">
          <ExecutionSuggestionsPanel />
          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#121212]">
            <header className="flex items-center justify-between px-4 pt-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#f2f2f0]">Queue</h2>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-white/10 px-1 font-mono text-xs text-[#f2f2f0]">
                  {queue.length}
                </span>
              </div>
              <span className="font-mono text-sm text-[#a3a3a0]">
                {scheduledLabel}
              </span>
            </header>
            {mixedBoard || startBoards.size > 1 ? (
              <p className="px-4 pt-3 text-xs text-destructive">
                Selected tasks must belong to the same space.
              </p>
            ) : null}
            {queue.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[#8f8f8c]">
                No tasks in the queue.
              </p>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
                <ExecutionQueueList
                  queue={queue}
                  selectedTaskIds={orderedSelected}
                  onSelect={selectQueued}
                  onRemove={removeQueued}
                />
              </div>
            )}
          </section>
          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#121212]">
            <header className="flex items-center justify-between px-4 pt-3">
              <h2 className="text-sm font-semibold text-[#f2f2f0]">
                Execution
              </h2>
              {session ? null : (
                <button
                  type="button"
                  disabled={!canStart}
                  className="primary-noise flex h-8 items-center gap-1.5 rounded-md bg-[#f2f2f0] px-3 text-sm font-medium text-[#0b0b0b] disabled:opacity-40"
                  onClick={start}
                >
                  Start
                  <PlayIcon />
                </button>
              )}
            </header>
            {session ? (
              <FocusPanel key={session.id} task={focused} tasks={tasks} />
            ) : (
              <ReadyPanel
                scheduledLabel={scheduledLabel}
                preset={preset}
                onPreset={setPreset}
              />
            )}
          </section>
        </div>
      )}
    </ExecutionCanvas>
  );
}

function ReadyPanel({
  scheduledLabel,
  preset,
  onPreset,
}: {
  scheduledLabel: string;
  preset: DurationPreset;
  onPreset: (preset: DurationPreset) => void;
}) {
  const caption =
    preset === "none"
      ? "no timer"
      : preset == null
        ? `from ${scheduledLabel}`
        : `from ${preset}m`;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 py-4">
      <TimerRing label="00:00" caption={caption} progress={0.08} />
      <div className="flex max-w-[280px] flex-col items-center gap-1 text-center">
        <p className="text-base font-semibold tracking-tight text-[#f2f2f0]">
          Ready to start
        </p>
        <p className="text-sm leading-[21px] text-[#a3a3a0]">
          Select tasks from the queue — or run the entire queue at once.
        </p>
      </div>
      <div className="flex gap-2">
        <PresetButton
          label="25 min"
          selected={preset === 25}
          onClick={() => onPreset(preset === 25 ? null : 25)}
        />
        <PresetButton
          label="50 min"
          selected={preset === 50}
          onClick={() => onPreset(preset === 50 ? null : 50)}
        />
        <PresetButton
          label="No timer"
          selected={preset === "none"}
          onClick={() => onPreset(preset === "none" ? null : "none")}
        />
      </div>
    </div>
  );
}

function FocusPanel({
  task,
  tasks,
}: {
  task: ExecutionCurrent | null;
  tasks: ExecutionCurrent[];
}) {
  const {
    actions: { focus, pause, resume, complete, setMode, setGoalMinutes },
    meta: {
      isCompleting,
      tracking,
      mode,
      goalMinutes,
      elapsedSeconds,
      shownSeconds,
    },
  } = useExecution();

  const goalLabel =
    mode === "stopwatch"
      ? "no timer"
      : `from ${formatEstimation(goalMinutes ?? task?.estimation ?? null) || "0m"}`;
  const progress =
    mode === "timer" && (goalMinutes ?? task?.estimation)
      ? Math.min(
          1,
          elapsedSeconds / ((goalMinutes ?? task?.estimation ?? 1) * 60),
        )
      : 0.08;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4 py-4">
      {tasks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tasks.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === task?.id}
              className={cn(
                "max-w-48 truncate rounded-md px-3 py-2 text-sm",
                item.id === task?.id
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
              onClick={() => focus(item.id)}
            >
              {item.summary}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No tasks in this session.
        </p>
      )}
      {task ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{task.taskKey}</p>
            <h3 className="mt-1 text-base font-semibold tracking-tight">
              {task.summary}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Estimate {formatEstimation(task.estimation)}
              {goalMinutes != null && goalMinutes > task.estimation
                ? ` · Goal ${formatEstimation(goalMinutes)}`
                : ""}
              {" · "}
              Executed {formatDuration(elapsedSeconds)}
            </p>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <ModeButton
          label="Timer"
          selected={mode === "timer"}
          onClick={() => setMode("timer")}
        />
        <ModeButton
          label="Stopwatch"
          selected={mode === "stopwatch"}
          onClick={() => setMode("stopwatch")}
        />
        {task && mode === "timer" ? (
          <AddTimeControls
            onAdd={(minutes) =>
              setGoalMinutes(
                extendGoalMinutes({
                  goalMinutes: goalMinutes ?? task.estimation,
                  elapsedSeconds,
                  addMinutes: minutes,
                }),
              )
            }
          />
        ) : null}
        {task && mode === "stopwatch" ? (
          <label className="ml-2 flex items-center gap-2 text-sm text-muted-foreground">
            Goal
            <input
              aria-label="Goal minutes"
              type="number"
              min={1}
              max={240}
              value={goalMinutes ?? ""}
              placeholder="min"
              className="h-8 w-16 rounded-md border border-border bg-transparent px-2 text-sm text-foreground outline-none"
              onChange={(event) => {
                const next = event.target.value;
                if (next === "") {
                  setGoalMinutes(null);
                  return;
                }
                const minutes = Number(next);
                if (!Number.isFinite(minutes)) return;
                setGoalMinutes(Math.min(240, Math.max(1, Math.floor(minutes))));
              }}
            />
            min
            {formatEstimation(goalMinutes) ? (
              <span>{formatEstimation(goalMinutes)}</span>
            ) : null}
          </label>
        ) : null}
      </div>
      <div className="flex justify-center">
        <TimerRing
          label={shownSeconds == null ? "—" : formatClock(shownSeconds)}
          caption={
            !task
              ? "No task is being tracked."
              : tracking
                ? goalLabel
                : "Paused"
          }
          progress={progress}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!task}
          onClick={() => (tracking ? pause() : resume())}
        >
          {tracking ? "Pause" : "Resume"}
        </Button>
        <Button size="sm" disabled={isCompleting} onClick={() => complete()}>
          Stop
        </Button>
      </div>
      {task ? <ExecutionTaskDetail task={task} /> : null}
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button size="sm" variant="outline" disabled>
          Ask AI
        </Button>
        <Button size="sm" variant="outline" disabled>
          Start AI Agent
        </Button>
      </div>
    </div>
  );
}

const ADD_TIME_PRESETS = [5, 15, 30] as const;

function AddTimeControls({ onAdd }: { onAdd: (minutes: number) => void }) {
  const [minutes, setMinutes] = useState("15");
  const parsed = Number(minutes);
  const canAdd = Number.isInteger(parsed) && parsed >= 1 && parsed <= 240;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Add time</span>
      {ADD_TIME_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
          onClick={() => onAdd(preset)}
        >
          +{preset}m
        </button>
      ))}
      <input
        aria-label="Minutes to add"
        type="number"
        min={1}
        max={240}
        value={minutes}
        className="h-8 w-16 rounded-md border border-border bg-transparent px-2 text-sm text-foreground outline-none"
        onChange={(event) => setMinutes(event.target.value)}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={!canAdd}
        onClick={() => onAdd(parsed)}
      >
        Add
      </Button>
    </div>
  );
}

function ModeButton({
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
        "rounded-md px-3 py-2 text-sm",
        selected
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <span className="flex h-8 items-center gap-1.5 rounded-md bg-white/[0.06] px-2.5 text-sm text-[#cfcfcc]">
      <span className="font-mono">{value}</span>
      {label}
    </span>
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
        "flex items-center justify-center rounded-md border px-3 py-2 text-sm",
        selected
          ? "primary-noise border-[#f2f2f0] bg-[#f2f2f0] text-[#0b0b0b]"
          : "border-white/10 bg-white/[0.05] text-[#e6e6e3] hover:bg-white/10",
      )}
      onClick={onClick}
    >
      {label}
    </button>
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
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const dash = Math.max(0.04, Math.min(1, progress)) * circumference;

  return (
    <div className="relative flex size-44 items-center justify-center">
      <svg
        viewBox="0 0 232 232"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <circle
          cx="116"
          cy="116"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
        />
        <circle
          cx="116"
          cy="116"
          r={radius}
          fill="none"
          stroke="#f2f2f0"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 116 116)"
        />
      </svg>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="font-mono text-3xl font-medium leading-none tracking-tight text-[#f2f2f0]">
          {label}
        </p>
        <p className="text-sm text-[#a3a3a0]">{caption}</p>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path d="M5.5 3.5v9l7-4.5-7-4.5z" fill="currentColor" />
    </svg>
  );
}

type DurationPreset = 25 | 50 | "none" | null;
