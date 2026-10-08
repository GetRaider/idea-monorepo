"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatEstimation } from "@repo/api/todex";
import type { ExecutionCurrent } from "@repo/api/todex";
import { Button, Spinner, cn } from "@repo/ui";

import { todexClient } from "@lib/todex-client";
import { applyTaskSelection, isToggleClick } from "../../tasks/task-selection";
import { useExecution } from "../execution-provider";
import { ExecutionQueueList } from "../execution-queue-list";
import { ExecutionCanvas } from "../execution-sidebar";
import { ExecutionSuggestionsPanel } from "../execution-suggestions-panel";
import { ExecutionTaskDetail } from "../execution-task-detail";
import { formatClock, formatDuration } from "../execution-time";
import { STATUS_LABEL } from "../../tasks/task-helpers";

export default function CurrentExecutionPage() {
  const {
    state: { session, tasks, focused, queue, isLoading, isError },
    actions: { execute, removeQueued },
    meta: { isExecuting },
  } = useExecution();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [mixedBoard, setMixedBoard] = useState(false);
  const orderedSelected = queue
    .map((item) => item.taskId)
    .filter((taskId) => selectedIds.includes(taskId));
  const visibleSelected = orderedSelected;
  const selectedBoards = new Set(
    queue
      .filter((item) => visibleSelected.includes(item.taskId))
      .map((item) => item.task.boardId),
  );
  const sameBoard = selectedBoards.size <= 1;
  const running = session != null;
  const shownId = orderedSelected.includes(previewId ?? "")
    ? previewId
    : (orderedSelected[0] ?? null);
  const preview = useQuery({
    queryKey: ["execution", "preview", orderedSelected],
    queryFn: () => todexClient.execution.preview({ taskIds: orderedSelected }),
    enabled: !running && orderedSelected.length > 0,
  });

  function selectQueued(
    taskId: string,
    event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
  ) {
    const next = applyTaskSelection({
      selectedIds: new Set(visibleSelected),
      anchorId: anchorId ?? visibleSelected[0] ?? null,
      taskId,
      orderedIds: queue.map((item) => item.taskId),
      shift: event.shiftKey,
      toggle: isToggleClick(event, navigator.platform),
    });
    const selected = queue.filter((item) => next.selectedIds.has(item.taskId));
    const boards = new Set(selected.map((item) => item.task.boardId));
    if (boards.size > 1) {
      setMixedBoard(true);
      return;
    }
    setMixedBoard(false);
    setAnchorId(next.anchorId);
    setSelectedIds([...next.selectedIds]);
  }

  return (
    <ExecutionCanvas title="Current">
      {isLoading ? (
        <Spinner className="flex-1" />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Could not load execution.</p>
      ) : (
        <div className="flex min-h-0 flex-1 gap-4">
          <ExecutionSuggestionsPanel />
          <section className="flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border border-border">
            <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2 className="text-sm font-medium">Execution Queue</h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {queue.length}
              </span>
            </header>
            {mixedBoard ? (
              <p className="border-b border-border px-4 py-2 text-xs text-destructive">
                Selected tasks must belong to the same board.
              </p>
            ) : null}
            {queue.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                No tasks in the queue.
              </p>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto">
                <ExecutionQueueList
                  queue={queue}
                  selectedTaskIds={visibleSelected}
                  onSelect={selectQueued}
                  onRemove={removeQueued}
                />
              </div>
            )}
          </section>
          <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-border">
            <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2 className="text-sm font-medium">Current Execution</h2>
              {session ? null : (
                <Button
                  size="sm"
                  disabled={
                    orderedSelected.length === 0 || !sameBoard || isExecuting
                  }
                  onClick={() => execute(orderedSelected)}
                >
                  Start
                </Button>
              )}
            </header>
            {session ? (
              <FocusPanel key={session.id} task={focused} tasks={tasks} />
            ) : (
              <SelectionPanel
                tasks={orderedSelected.length > 0 ? (preview.data ?? []) : []}
                shownId={shownId}
                isLoading={preview.isLoading && orderedSelected.length > 0}
                isError={preview.isError}
                onShow={setPreviewId}
              />
            )}
          </section>
        </div>
      )}
    </ExecutionCanvas>
  );
}

function SelectionPanel({
  tasks,
  shownId,
  isLoading,
  isError,
  onShow,
}: {
  tasks: ExecutionCurrent[];
  shownId: string | null;
  isLoading: boolean;
  isError: boolean;
  onShow: (taskId: string) => void;
}) {
  const task = tasks.find((item) => item.id === shownId) ?? tasks[0] ?? null;

  if (isLoading) return <Spinner className="flex-1" />;
  if (isError) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        Could not load the selected tasks.
      </p>
    );
  }
  if (!task) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        Select tasks from the queue.
      </p>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto px-6 py-8">
      <SelectionSummary tasks={tasks} />
      {tasks.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {tasks.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === task.id}
              className={cn(
                "h-8 max-w-48 truncate rounded-md px-3 text-sm",
                item.id === task.id
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
              onClick={() => onShow(item.id)}
            >
              {item.summary}
            </button>
          ))}
        </div>
      ) : null}
      {tasks.length > 1 ? (
        <div>
          <p className="text-xs text-muted-foreground">{task.taskKey}</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">
            {task.summary}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Executed {formatDuration(task.actualTime)}
          </p>
        </div>
      ) : null}
      <ExecutionTaskDetail task={task} />
    </div>
  );
}

function SelectionSummary({ tasks }: { tasks: ExecutionCurrent[] }) {
  const task = tasks[0];
  if (!task) return null;
  if (tasks.length === 1) {
    return (
      <div className="rounded-xl border border-border px-4 py-3">
        <p className="text-sm font-medium">{task.summary}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {summaryParts(task).join(" · ")}
        </p>
      </div>
    );
  }
  const minutes = tasks.reduce((total, item) => total + item.estimation, 0);
  const areas = [
    ...new Set(tasks.flatMap((item) => (item.isDefaultArea ? [] : [item.areaName]))),
  ];
  return (
    <div className="rounded-xl border border-border px-4 py-3">
      <p className="text-sm font-medium">{tasks.length} tasks</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Estimate {formatEstimation(minutes)}
        {" · "}
        {task.boardName}
        {areas.length > 0 ? ` (${areas.join(", ")})` : ""}
      </p>
    </div>
  );
}

function summaryParts(task: ExecutionCurrent) {
  return [
    `Estimate ${formatEstimation(task.estimation)}`,
    task.isDefaultArea ? task.boardName : `${task.boardName} (${task.areaName})`,
    STATUS_LABEL[task.status],
    task.stageName,
    task.scheduleDate ? `Scheduled ${formatDay(task.scheduleDate)}` : null,
    task.dueDate ? `Due ${formatDay(task.dueDate)}` : null,
  ].flatMap((part) => (part ? [part] : []));
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
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

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto px-6 py-8">
      {tasks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tasks.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === task?.id}
              className={cn(
                "h-8 max-w-48 truncate rounded-md px-3 text-sm",
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
        <p className="text-sm text-muted-foreground">No tasks in this session.</p>
      )}
      {task ? (
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{task.taskKey}</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">
            {task.summary}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Estimate {formatEstimation(task.estimation)}
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
      <p className="font-mono text-5xl tabular-nums tracking-tight">
        {shownSeconds == null ? "—" : formatClock(shownSeconds)}
      </p>
      <p className="text-sm text-muted-foreground">
        {!task
          ? "No task is being tracked."
          : tracking
            ? `Focused ${formatDuration(elapsedSeconds)}`
            : "Paused"}
      </p>
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
        "h-8 rounded-md px-3 text-sm",
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
