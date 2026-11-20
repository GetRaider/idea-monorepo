"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TaskStatus } from "@repo/api/todex";
import { ConfirmDialog, Spinner } from "@repo/ui";

import { useExecution } from "./execution-provider";
import { ExecutionFocusView } from "./execution-focus-view";
import { ExecutionWorkspaceView } from "./execution-workspace-view";
import { readSelectedTask, writeSelectedTask } from "./execution-selection";
import {
  executionSessionTitle,
  extendGoalMinutes,
  selectedSessionTaskId,
  sessionClockSeconds,
} from "./execution-time";

interface StoredSelection {
  sessionId: string;
  taskId: string | null;
}

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
    actions: { pause, resume, complete, setGoalMinutes },
    meta: { tracking, mode, goalMinutes, sessionElapsedSeconds, isCompleting },
  } = useExecution();

  const [finishOpen, setFinishOpen] = useState(false);
  const [stored, setStored] = useState<StoredSelection | null>(null);
  const [pickedTaskId, setPickedTaskId] = useState<string | null | undefined>(undefined);
  const isFocusView = params.get("view") !== "workspace";

  const storedSelection = session
    ? selectedSessionTaskId({
        sessionId: session.id,
        queryTaskId: params.get("task"),
        storedSessionId: stored?.sessionId ?? null,
        storedTaskId: stored?.taskId ?? null,
        taskIds: tasks.map((task) => task.id),
      })
    : null;
  const visibleTaskId = pickedTaskId === undefined ? storedSelection : pickedTaskId;
  const selectedTask =
    tasks.find((task) => task.id === visibleTaskId) ??
    focused ??
    tasks.find((task) => task.status !== TaskStatus.DONE && task.status !== TaskStatus.CANCELLED) ??
    tasks[0] ??
    null;
  const activeTask = selectedTask;

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
    if (enabled) next.delete("view");
    else next.set("view", "workspace");
    router.replace("/execution/session" + (next.size ? "?" + next.toString() : ""));
  }

  function select(taskId: string, openDetails = false) {
    if (!session) return;
    setPickedTaskId(taskId);
    writeSelectedTask(session.id, taskId);
    const next = new URLSearchParams(params.toString());
    next.set("task", taskId);
    if (openDetails) next.set("view", "workspace");
    router.replace("/execution/session?" + next.toString());
  }

  function extend(minutes: number) {
    if (goalMinutes == null) return;
    setGoalMinutes(
      extendGoalMinutes({
        goalMinutes,
        elapsedSeconds: sessionElapsedSeconds,
        addMinutes: minutes,
      }),
    );
  }

  if (!session) return <Spinner className="flex-1" />;

  const sessionTitle = executionSessionTitle({
    startedAt: session.startedAt,
    spaceName: tasks[0]?.spaceName ?? null,
  });
  const clockSeconds = sessionClockSeconds({
    mode,
    elapsedSeconds: sessionElapsedSeconds,
    goalMinutes,
  });
  const completedTasks = tasks.filter((task) => task.status === TaskStatus.DONE).length;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-4 pb-6 pt-3 sm:px-6">
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
          completedTasks={completedTasks}
          onExit={() => setFocusView(false)}
          onOpenDetails={(taskId) => select(taskId, true)}
          onSwitchTask={(taskId) => {
            if (taskId) select(taskId);
          }}
          onExtend={extend}
          onPause={pause}
          onResume={resume}
          onFinish={() => setFinishOpen(true)}
        />
      ) : (
        <ExecutionWorkspaceView
          sessionTitle={sessionTitle}
          tasks={tasks}
          selectedTask={selectedTask}
          mode={mode}
          goalMinutes={goalMinutes}
          clockSeconds={clockSeconds}
          elapsedSeconds={sessionElapsedSeconds}
          tracking={tracking}
          isCompleting={isCompleting}
          onSelectTask={select}
          onPause={pause}
          onResume={resume}
          onFinish={() => setFinishOpen(true)}
          onEnterFocus={() => setFocusView(true)}
          onExtend={extend}
        />
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
