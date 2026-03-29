"use client";

import { useEffect, useMemo, useState } from "react";

import { TaskStatus } from "@/constants/tasks.constants";
import { useIsAnonymous } from "@/hooks/use-is-anonymous";
import { useGuestTasks } from "@/hooks/use-guest-store";
import { guestTasksForBoard } from "@/lib/guest-store/guest-task-filters";
import { apiServices } from "@/services/api";
import { cn } from "@/lib/utils";
import type { Task } from "@/components/Boards/KanbanBoard/types";
import type { TaskBoard } from "@/types/workspace";

type StatusCounts = Record<TaskStatus, number>;

function countStatusesRecursive(tasks: Task[]): StatusCounts {
  const counts: StatusCounts = {
    [TaskStatus.TODO]: 0,
    [TaskStatus.IN_PROGRESS]: 0,
    [TaskStatus.DONE]: 0,
  };

  const walk = (task: Task) => {
    counts[task.status] += 1;
    task.subtasks?.forEach(walk);
  };

  tasks.forEach(walk);
  return counts;
}

export function BoardHealthPanel({ boards }: { boards: TaskBoard[] }) {
  const isAnonymous = useIsAnonymous();
  const { tasks: guestTasks } = useGuestTasks();
  const [countsByBoardId, setCountsByBoardId] = useState<
    Record<string, StatusCounts | undefined>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (boards.length === 0) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        if (isAnonymous) {
          const results = boards.map((board) => {
            const tasks = guestTasksForBoard(guestTasks, board.id);
            return [board.id, countStatusesRecursive(tasks)] as const;
          });
          if (cancelled) return;
          setCountsByBoardId(Object.fromEntries(results));
          return;
        }

        const results = await Promise.all(
          boards.map(async (board) => {
            const tasks = await apiServices.tasks.getByBoardId(board.id);
            return [board.id, countStatusesRecursive(tasks)] as const;
          }),
        );
        if (cancelled) return;
        setCountsByBoardId(Object.fromEntries(results));
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [boards, isAnonymous, guestTasks]);

  const sortedBoards = useMemo(
    () => [...boards].sort((a, b) => a.name.localeCompare(b.name)),
    [boards],
  );

  const totalTasks = useMemo(() => {
    let total = 0;
    for (const board of sortedBoards) {
      const counts = countsByBoardId[board.id];
      if (!counts) continue;
      total +=
        counts[TaskStatus.TODO] +
        counts[TaskStatus.IN_PROGRESS] +
        counts[TaskStatus.DONE];
    }
    return total;
  }, [sortedBoards, countsByBoardId]);

  if (boards.length === 0) return null;

  return (
    <aside
      className={cn(
        "flex w-full min-w-0 flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 lg:sticky lg:top-6 lg:max-h-[min(80vh,calc(100vh-8rem))] lg:overflow-y-auto",
      )}
    >
      <h2 className="m-0 text-sm font-semibold text-[var(--text-primary)]">
        Board Health
      </h2>
      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
        Analyzes the distribution of tasks.
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading…</p>
      ) : loadError ? (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Could not load task stats.
        </p>
      ) : totalTasks === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          You haven&apos;t made any progress yet — give it a shot.
        </p>
      ) : (
        <ul className="mt-4 flex list-none flex-col gap-4 p-0">
          {sortedBoards.map((board) => {
            const counts = countsByBoardId[board.id];
            if (!counts) return null;
            const todo = counts[TaskStatus.TODO];
            const progress = counts[TaskStatus.IN_PROGRESS];
            const done = counts[TaskStatus.DONE];
            const sum = todo + progress + done;
            if (sum === 0) return null;
            const pct = (n: number) => `${(n / sum) * 100}%`;

            return (
              <li key={board.id} className="min-w-0">
                <div className="truncate text-xs font-medium text-[var(--text-primary)]">
                  {board.emoji ? (
                    <span className="mr-1" aria-hidden>
                      {board.emoji}
                    </span>
                  ) : null}
                  {board.name}
                </div>
                <div
                  className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-[var(--input-bg)]"
                  role="img"
                  aria-label={`${board.name}: ${todo} to do, ${progress} in progress, ${done} done`}
                >
                  <span
                    className="h-full bg-[var(--text-tertiary)] opacity-80"
                    style={{ width: pct(todo) }}
                  />
                  <span
                    className="h-full bg-[#7255c1]"
                    style={{ width: pct(progress) }}
                  />
                  <span
                    className="h-full bg-emerald-500/90"
                    style={{ width: pct(done) }}
                  />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--text-tertiary)]">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--text-tertiary)] opacity-80"
                      aria-hidden
                    />
                    To do {todo}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#7255c1]"
                      aria-hidden
                    />
                    In progress {progress}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/90"
                      aria-hidden
                    />
                    Done {done}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
