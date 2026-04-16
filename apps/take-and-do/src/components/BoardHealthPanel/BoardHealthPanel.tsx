"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { TaskStatus } from "@/constants/tasks.constants";
import { queryKeys } from "@/lib/query-keys";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { useGuestTasks } from "@/hooks/tasks/use-guest-store";
import { guestTasksForBoard } from "@/stores/guest/guest-task-filters";
import { clientServices } from "@/services";
import { cn } from "@/lib/styles/utils";
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

  const taskQueries = useQueries({
    queries: boards.map((board) => ({
      queryKey: queryKeys.tasks.byBoard(board.id),
      queryFn: () => clientServices.tasks.getByBoardId(board.id),
      enabled: !isAnonymous && boards.length > 0,
    })),
  });

  const countsByBoardId = useMemo(() => {
    if (boards.length === 0) return {};
    if (isAnonymous) {
      return Object.fromEntries(
        boards.map((board) => {
          const tasks = guestTasksForBoard(guestTasks, board.id);
          return [board.id, countStatusesRecursive(tasks)] as const;
        }),
      );
    }
    return Object.fromEntries(
      boards.map((board, index) => {
        const tasks = taskQueries[index]?.data ?? [];
        return [board.id, countStatusesRecursive(tasks)] as const;
      }),
    );
  }, [boards, isAnonymous, guestTasks, taskQueries]);

  const isLoading =
    !isAnonymous && boards.length > 0 && taskQueries.some((q) => q.isPending);

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
        "flex w-full min-w-0 flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--background-primary)] p-4 lg:sticky lg:top-6 lg:max-h-[min(80vh,calc(100vh-8rem))] lg:overflow-y-auto",
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
