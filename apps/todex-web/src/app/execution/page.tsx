"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatEstimation, TaskStatus } from "@repo/api/todex";
import { ConfirmDialog, Spinner } from "@repo/ui";

import { applyTaskSelection, isToggleClick } from "../planning/task-selection";
import { useExecution } from "./execution-provider";
import { ExecutionQueueList } from "./execution-queue-list";
import { ExecutionCanvas } from "./execution-canvas";
import {
  ExecutionModeSwitch,
  ReadyExecutionPanel,
  RunningExecutionPanel,
} from "./execution-panel";
import { ExecutionSuggestionsPanel } from "./execution-suggestions-panel";
import { writeSelectedTask } from "./execution-selection";
import { executionSessionTitle, queuedStartIds } from "./execution-time";

export default function ExecutionPage() {
  const {
    state: { session, tasks, queue, isLoading, isError },
    actions: {
      execute,
      pause,
      resume,
      complete,
      removeQueued,
      reorder,
      setMode,
      setGoalMinutes,
    },
    meta: {
      isCompleting,
      isExecuting,
      tracking,
      mode,
      goalMinutes,
      sessionElapsedSeconds,
    },
  } = useExecution();
  const router = useRouter();
  const [finishOpen, setFinishOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [explicit, setExplicit] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [focusModeOn, setFocusModeOn] = useState(true);
  const [pendingStart, setPendingStart] = useState(false);
  const visibleQueue = showDone ? queue : queue.filter((item) => item.task.status !== TaskStatus.DONE);
  const queueIds = visibleQueue.map((item) => item.taskId);
  const selectedInQueue = selectedIds.filter((taskId) =>
    queueIds.includes(taskId),
  );
  const startIds = queuedStartIds(queueIds, selectedInQueue, explicit);
  const startTasks = startIds.flatMap((taskId) => {
    const item = visibleQueue.find((queued) => queued.taskId === taskId);
    return item ? [item.task] : [];
  });
  const startBoards = new Set(startTasks.map((task) => task.spaceId));
  const defaultGoalMinutes = startTasks.reduce((sum, task) => sum + task.estimation, 0);
  const preparedGoalMinutes = goalMinutes ?? (defaultGoalMinutes || null);
  const mixedSpace = startBoards.size > 1;
  const hasCompletedSelection = startTasks.some((task) => task.status === TaskStatus.DONE);
  const canStart =
    startIds.length > 0 && startBoards.size <= 1 && !hasCompletedSelection && !isExecuting && !session;
  const scheduledMinutes = queue.reduce(
    (total, item) => total + item.task.estimation,
    0,
  );
  const scheduledLabel = formatEstimation(scheduledMinutes) || "0m";

  function applySelection(nextIds: string[], nextAnchor: string | null) {
    setExplicit(true);
    setAnchorId(nextAnchor);
    setSelectedIds(nextIds);
  }

  function start() {
    if (!canStart) return;
    setGoalMinutes(preparedGoalMinutes);
    setPendingStart(true);
    execute(startIds);
  }

  useEffect(() => {
    if (!pendingStart || !session) return;
    setPendingStart(false);
    router.push("/execution/session" + (focusModeOn ? "" : "?view=workspace"));
  }, [pendingStart, session, focusModeOn, router]);

  function selectQueued(
    taskId: string,
    event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
  ) {
    const next = applyTaskSelection({
      selectedIds: new Set(startIds),
      anchorId: anchorId ?? startIds[0] ?? null,
      taskId,
      orderedIds: queueIds,
      shift: event.shiftKey,
      toggle: isToggleClick(event, navigator.platform),
    });
    applySelection([...next.selectedIds], next.anchorId);
  }

  function selectAll() {
    applySelection(queueIds, queueIds[0] ?? null);
  }

  function clearSelection() {
    applySelection([], null);
  }

  function reorderVisible(taskIds: string[]) {
    const hidden = queue.map((item) => item.taskId).filter((id) => !queueIds.includes(id));
    reorder([...taskIds, ...hidden]);
  }

  return (
    <>
      <ExecutionCanvas
        title="Execution"
        actions={
          <div className="flex gap-2">
            <StatChip value={String(visibleQueue.length)} label="in queue" />
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
            <ExecutionSuggestionsPanel showDone={showDone} onShowDoneChange={setShowDone} />
            <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#121212]">
              <header className="flex items-center justify-between px-4 pt-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#f2f2f0]">
                    Queue
                  </h2>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-white/10 px-1 font-mono text-xs text-[#f2f2f0]">
                    {visibleQueue.length}
                  </span>
                  {queueIds.length > 0 && startIds.length !== queueIds.length ? (
                    <button
                      type="button"
                      className="text-xs text-[#a3a3a0] hover:text-[#f2f2f0]"
                      onClick={selectAll}
                    >
                      Select all
                    </button>
                  ) : startIds.length > 0 ? (
                    <button type="button" className="text-xs text-[#a3a3a0] hover:text-[#f2f2f0]" onClick={clearSelection}>
                      Clear
                    </button>
                  ) : null}
                </div>
                <span className="font-mono text-sm text-[#a3a3a0]">
                  {scheduledLabel}
                </span>
              </header>
              {mixedSpace ? (
                <p className="px-4 pt-3 text-xs text-destructive">
                  Selected tasks must belong to the same space.
                </p>
              ) : null}
              {hasCompletedSelection ? (
                <p className="px-4 pt-3 text-xs text-destructive">
                  Completed tasks can be viewed but cannot be started again.
                </p>
              ) : null}
              {visibleQueue.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[#8f8f8c]">
                  No tasks in the queue.
                </p>
              ) : (
                <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
                  <ExecutionQueueList
                    queue={visibleQueue}
                    selectedTaskIds={startIds}
                    onSelect={selectQueued}
                    onRemove={removeQueued}
                    onReorder={reorderVisible}
                  />
                </div>
              )}
            </section>
            <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#121212]">
              <header className="flex items-center justify-between gap-3 px-4 pt-3">
                <h2 className="text-sm font-semibold text-[#f2f2f0]">
                  Execution
                </h2>
                <ExecutionModeSwitch />
              </header>
              {session ? (
                <RunningExecutionPanel
                  tasks={tasks}
                  sessionTitle={executionSessionTitle({
                    startedAt: session.startedAt,
                    spaceName: tasks[0]?.spaceName ?? null,
                  })}
                  tracking={tracking}
                  mode={mode}
                  goalMinutes={goalMinutes}
                  elapsedSeconds={sessionElapsedSeconds}
                  isCompleting={isCompleting}
                  onOpen={() => router.push("/execution/session" + (focusModeOn ? "" : "?view=workspace"))}
                  onOpenTask={(taskId) => {
                    writeSelectedTask(session.id, taskId);
                    router.push(
                      `/execution/session?task=${encodeURIComponent(taskId)}&view=workspace`,
                    );
                  }}
                  onPause={pause}
                  onResume={resume}
                  onFinish={() => setFinishOpen(true)}
                />
              ) : (
                <ReadyExecutionPanel
                  tasks={startTasks}
                  goalMinutes={preparedGoalMinutes}
                  mode={mode}
                  focusModeOn={focusModeOn}
                  onFocusModeChange={setFocusModeOn}
                  canStart={canStart}
                  onMode={setMode}
                  onGoalMinutes={setGoalMinutes}
                  onRemove={removeQueued}
                  onStart={start}
                />
              )}
            </section>
          </div>
        )}
      </ExecutionCanvas>
      {finishOpen ? (
        <ConfirmDialog
          title="Finish execution"
          description="Unfinished tasks stay as they are. This session is saved to History."
          confirmLabel="Finish"
          onConfirm={() => complete()}
          onClose={() => setFinishOpen(false)}
        />
      ) : null}
    </>
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
