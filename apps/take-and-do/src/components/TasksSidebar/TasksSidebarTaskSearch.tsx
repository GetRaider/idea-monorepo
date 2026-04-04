"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Task } from "@/components/Boards/KanbanBoard/types";
import { Search, SearchInput } from "@/components/TasksSidebar/TasksSidebar.ui";
import { SearchIcon } from "@/components/Icons";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { tasksHelper } from "@/helpers/task.helper";
import { useIsAnonymous } from "@/hooks/use-is-anonymous";
import { useGuestTasks } from "@/hooks/use-guest-store";
import { cn } from "@/lib/styles/utils";
import { clientServices } from "@/services";
import type { TaskBoard } from "@/types/workspace";

type TasksSidebarTaskSearchProps = {
  taskBoards: TaskBoard[];
};

export function TasksSidebarTaskSearch({
  taskBoards,
}: TasksSidebarTaskSearchProps) {
  const router = useRouter();
  const isAnonymous = useIsAnonymous();
  const { tasks: guestTasks } = useGuestTasks();
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (isAnonymous) {
      setTasks(guestTasks);
      setLoaded(true);
      return () => {
        cancelled = true;
      };
    }

    clientServices.tasks
      .getAll()
      .then((data) => {
        if (!cancelled) setTasks(data);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isAnonymous, guestTasks]);

  const normalizedQuery = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (normalizedQuery.length === 0) return [];
    return tasks
      .filter((task) => task.summary.toLowerCase().includes(normalizedQuery))
      .slice(0, 50);
  }, [tasks, normalizedQuery]);

  const boardNameFor = (taskBoardId: string) =>
    taskBoards.find((board) => board.id === taskBoardId)?.name ?? "Board";

  const openTask = (task: Task) => {
    const boardName = boardNameFor(task.taskBoardId);
    const href = tasksUrlHelper.routing.buildBoardUrl(
      boardName,
      task.taskKey ?? undefined,
    );
    router.push(href);
    setQuery("");
  };

  const showPopover = normalizedQuery.length > 0;

  return (
    <div className="relative">
      <Search>
        <SearchIcon size={16} />
        <SearchInput
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks..."
          autoComplete="off"
        />
      </Search>

      {showPopover ? (
        <div
          className={cn(
            "absolute left-0 right-0 top-full z-[100] mt-1 max-h-64 overflow-y-auto overflow-x-hidden rounded-lg border border-border-app bg-card-bg py-1 shadow-lg",
          )}
          aria-label="Task search results"
        >
          {!loaded ? (
            <div className="px-3 py-2 text-sm text-[#888]">Loading…</div>
          ) : matches.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[#888]">No tasks found</div>
          ) : (
            matches.map((task) => (
              <button
                key={task.id}
                type="button"
                className="flex w-full min-w-0 flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-[#2a2a2a]"
                onClick={() => openTask(task)}
              >
                <span className="flex w-full min-w-0 items-start gap-1.5 leading-snug">
                  <span
                    className="shrink-0 pt-px text-[13px] leading-none"
                    title={tasksHelper.priority.getName(
                      tasksHelper.priority.format(task.priority),
                    )}
                  >
                    {tasksHelper.priority.getIconLabel(
                      tasksHelper.priority.format(task.priority),
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {task.summary}
                  </span>
                </span>
                <span className="w-full min-w-0 truncate text-xs text-[#666]">
                  {boardNameFor(task.taskBoardId)}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
