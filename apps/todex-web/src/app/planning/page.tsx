"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DocType, GoalStatus } from "@repo/api/todex";
import type { DocSummary, Task } from "@repo/api/todex";
import { Button, Spinner, cn } from "@repo/ui";

import { PlusIcon } from "@components/icons";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { todexClient } from "@lib/todex-client";

import { TaskComposer } from "./task-composer";
import {
  INBOX_BOARD_NAME,
  isClosedStatus,
  isInboxTask,
  isOverdueTask,
  isUnscheduledTask,
  tasksByCompletedDescending,
  tasksByCreatedAtDescending,
} from "./task-helpers";
import { useTasks } from "./tasks-provider";

export default function TasksRootPage() {
  const {
    state: { boards, tasks, search },
    actions: { createTask, openCreateDialog },
    meta: { isLoading, isTasksLoading, createInputRef },
  } = useTasks();
  const [access, setAccess] = useState<QuickAccess | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const query = search.trim().toLowerCase();
  const visibleTasks = tasks.filter((task) =>
    query
      ? `${task.summary} ${task.taskKey}`.toLowerCase().includes(query)
      : true,
  );
  const spaceNameById = new Map(boards.map((board) => [board.id, board.name]));
  const activeAccess = QUICK_ACCESS.find((item) => item.id === access) ?? null;
  const accessTasks = activeAccess
    ? visibleTasks.filter((task) => activeAccess.match(task))
    : [];
  const inboxBoardId =
    boards.find((board) => board.name === INBOX_BOARD_NAME)?.id ??
    boards[0]?.id;
  const recentTasks = tasksByCreatedAtDescending(visibleTasks, RECENT_LIMIT);
  const completedTasks = tasksByCompletedDescending(visibleTasks, RECENT_LIMIT);
  const goalsQuery = useQuery({
    queryKey: ["docs", { type: DocType.GOAL }],
    queryFn: () => todexClient.docs.list({ type: DocType.GOAL }),
  });
  const goals = recentGoals(goalsQuery.data ?? [], query);

  function openComposer() {
    if (boards.length === 0) {
      openCreateDialog();
      return;
    }
    setIsComposerOpen(true);
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 pb-6 pt-3">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Planning</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openComposer}>
            <PlusIcon size={16} />
            New Task
          </Button>
        </div>
      </div>
      {boards.length > 0 ? (
        <div className="mb-6">
          <TaskComposer
            titleRef={createInputRef}
            boards={boards}
            defaultBoardId={inboxBoardId}
            open={isComposerOpen}
            onOpenChange={setIsComposerOpen}
            onCreate={(values) => {
              createTask(values.summary, null, {
                status: values.status,
                priority: values.priority,
                estimation: values.estimation,
                spaceId: values.spaceId ?? undefined,
                scheduleDate: values.scheduleDate,
                dueDate: values.dueDate,
              });
            }}
          />
        </div>
      ) : null}
      {isLoading || isTasksLoading ? (
        <Spinner className="flex-1" />
      ) : (
        <div className="flex w-full flex-col gap-8">
          <GoalsSection
            goals={goals}
            isLoading={goalsQuery.isPending}
            isError={goalsQuery.isError}
            emptyLabel={
              query ? "Nothing matches this search." : "No goals yet."
            }
          />
          <section className="flex flex-col gap-8">
            <div>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">Tasks</h2>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Quick Access
              </h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-2">
                {QUICK_ACCESS.map((item) => {
                  const count = visibleTasks.filter((task) =>
                    item.match(task),
                  ).length;
                  const selected = access === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      className={cn(
                        "flex w-full min-w-0 flex-col items-start gap-1 rounded-lg border border-border px-3 py-3 text-left hover:bg-surface",
                        selected && "bg-surface",
                      )}
                      onClick={() =>
                        setAccess((current) =>
                          current === item.id ? null : item.id,
                        )
                      }
                    >
                      <span className="w-full truncate text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {activeAccess ? (
              <HubTaskSection
                title={activeAccess.label}
                tasks={accessTasks.slice(0, SLICE_LIMIT)}
                hiddenCount={Math.max(0, accessTasks.length - SLICE_LIMIT)}
                spaceNameById={spaceNameById}
                emptyLabel={
                  query
                    ? "Nothing matches this search."
                    : activeAccess.emptyLabel
                }
              />
            ) : null}
            <HubTaskSection
              title="Recently Created"
              tasks={recentTasks}
              spaceNameById={spaceNameById}
              emptyLabel={
                query ? "Nothing matches this search." : "No tasks yet."
              }
            />
            <HubTaskSection
              title="Recently Completed"
              tasks={completedTasks}
              spaceNameById={spaceNameById}
              emptyLabel={
                query ? "Nothing matches this search." : "No completed tasks."
              }
            />
          </section>
        </div>
      )}
    </section>
  );
}

function GoalsSection({
  goals,
  isLoading,
  isError,
  emptyLabel,
}: {
  goals: DocSummary[];
  isLoading: boolean;
  isError: boolean;
  emptyLabel: string;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Goals</h2>
        <Link
          href="/planning/goals"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Open
        </Link>
      </div>
      {isLoading ? (
        <Spinner className="py-2" />
      ) : isError ? (
        <p className="px-2 py-2 text-sm text-muted-foreground">
          Goals are unavailable.
        </p>
      ) : goals.length === 0 ? (
        <p className="px-2 py-2 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col">
          {goals.map((goal) => (
            <li key={goal.id}>
              <Link
                href={`/planning/goals/${goal.id}`}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-surface"
              >
                <span className="min-w-0 flex-1 truncate">{goal.title}</span>
                <span className="w-16 shrink-0 text-muted-foreground">
                  {GOAL_STATUS_LABEL[goal.goalStatus ?? GoalStatus.ACTIVE]}
                </span>
                <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
                  {goal.progressPercent ?? 0}%
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HubTaskSection({
  title,
  tasks,
  spaceNameById,
  emptyLabel,
  hiddenCount = 0,
}: {
  title: string;
  tasks: Task[];
  spaceNameById: Map<string, string>;
  emptyLabel: string;
  hiddenCount?: number;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-muted-foreground">
        {title}
      </h2>
      {tasks.length === 0 ? (
        <p className="px-2 py-2 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col">
          {tasks.map((task) => {
            const spaceName = spaceNameById.get(task.spaceId) ?? "Space";
            return (
              <li key={task.id}>
                <Link
                  href={tasksUrlHelper.routing.buildBoardUrl(
                    spaceName,
                    task.taskKey,
                  )}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-surface"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {task.taskKey}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate",
                      isClosedStatus(task.status) &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {task.summary}
                  </span>
                  <span className="max-w-40 truncate text-xs text-muted-foreground">
                    {spaceName}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {hiddenCount > 0 ? (
        <p className="px-2 pt-1 text-xs text-muted-foreground">
          {hiddenCount} more
        </p>
      ) : null}
    </section>
  );
}

const RECENT_LIMIT = 5;
const SLICE_LIMIT = 8;

const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  [GoalStatus.ACTIVE]: "Active",
  [GoalStatus.PAUSED]: "Paused",
  [GoalStatus.DONE]: "Done",
};

function recentGoals(goals: DocSummary[], query: string) {
  const matched = query
    ? goals.filter(
        (goal) =>
          goal.title.toLowerCase().includes(query) ||
          goal.docKey.toLowerCase().includes(query),
      )
    : goals;
  return matched
    .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, RECENT_LIMIT);
}

const QUICK_ACCESS: QuickAccessItem[] = [
  {
    id: "inbox",
    label: "Inbox",
    emptyLabel: "Inbox is clear.",
    match: isInboxTask,
  },
  {
    id: "unscheduled",
    label: "Unscheduled",
    emptyLabel: "No unscheduled tasks.",
    match: isUnscheduledTask,
  },
  {
    id: "overdue",
    label: "Overdue",
    emptyLabel: "No overdue tasks.",
    match: (task) => isOverdueTask(task, new Date()),
  },
  {
    id: "all",
    label: "All",
    emptyLabel: "No tasks yet.",
    match: () => true,
  },
];

type QuickAccess = "inbox" | "unscheduled" | "overdue" | "all";

interface QuickAccessItem {
  id: QuickAccess;
  label: string;
  emptyLabel: string;
  match: (task: Task) => boolean;
}
