"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
  type KeyboardEventHandler,
} from "react";
import { useRouter } from "next/navigation";

import type { Task } from "@/components/Boards/KanbanBoard/types";
import { SearchInput } from "@/components/TasksSidebar/TasksSidebar.ui";
import { SearchIcon } from "@/components/Icons";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { tasksHelper } from "@/helpers/task.helper";
import { queryKeys } from "@/lib/query-keys";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { useGuestTasks } from "@/hooks/tasks/use-guest-store";
import { cn } from "@/lib/styles/utils";
import { clientServices } from "@/services";
import type { TaskBoard } from "@/types/workspace";

type TaskSearchHeaderProps = {
  taskBoards: TaskBoard[];
  className?: string;
};

export function TaskSearchHeader({
  taskBoards,
  className,
}: TaskSearchHeaderProps) {
  const router = useRouter();
  const isAnonymous = useIsAnonymous();
  const { tasks: guestTasks } = useGuestTasks();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const allTasksQuery = useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: () => clientServices.tasks.getAll(),
    enabled: !isAnonymous,
  });

  const tasks = useMemo(
    () => (isAnonymous ? guestTasks : (allTasksQuery.data ?? [])),
    [isAnonymous, guestTasks, allTasksQuery.data],
  );
  const loaded = isAnonymous || !allTasksQuery.isPending;

  const normalizedQuery = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (normalizedQuery.length === 0) return [];
    return tasks
      .filter((task) => task.summary.toLowerCase().includes(normalizedQuery))
      .slice(0, 50);
  }, [tasks, normalizedQuery]);

  const boardNameFor = (taskBoardId: string) =>
    taskBoards.find((board) => board.id === taskBoardId)?.name ?? "Board";

  const clear = () => setQuery("");

  const openTask = (task: Task) => {
    const boardName = boardNameFor(task.taskBoardId);
    const href = tasksUrlHelper.routing.buildBoardUrl(
      boardName,
      task.taskKey ?? undefined,
    );
    router.push(href);
    clear();
    setExpanded(false);
  };

  const showTaskPopover = expanded && normalizedQuery.length > 0;

  useEffect(() => {
    if (!expanded) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [expanded]);

  const handleSearchKeyDown: KeyboardEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      clear();
      setExpanded(false);
    }
  };

  const onQueryChange: ChangeEventHandler<HTMLInputElement> = (e) =>
    setQuery(e.target.value);

  if (!expanded) {
    return (
      <div className={cn("shrink-0", className)}>
        <button
          type="button"
          aria-label="Search tasks"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input-border bg-input-bg text-[#888] transition-colors hover:text-[var(--text-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          onClick={() => setExpanded(true)}
        >
          <SearchIcon size={18} className="opacity-90" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative min-h-10 min-w-0 shrink-0", className)}>
      <div
        className={cn(
          "flex min-h-10 shrink-0 items-center overflow-hidden rounded-lg border border-input-border bg-input-bg text-[#888] transition-[width,max-width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "min-w-0 gap-2 px-2 py-px sm:w-64 sm:max-w-[18rem] sm:flex-none lg:w-72 lg:max-w-[20rem]",
        )}
      >
        <SearchIcon size={16} className="shrink-0 opacity-80" />
        <SearchInput
          ref={inputRef}
          type="search"
          value={query}
          onChange={onQueryChange}
          onKeyDown={handleSearchKeyDown}
          onBlur={() => {
            window.setTimeout(() => {
              if (!query.trim()) setExpanded(false);
            }, 120);
          }}
          placeholder="Search tasks"
          autoComplete="off"
          className="min-w-0 flex-1"
        />
      </div>

      {showTaskPopover ? (
        <div
          className={cn(
            "absolute right-0 top-full z-[100] mt-1 w-[min(100vw-2rem,24rem)] max-h-64 overflow-y-auto overflow-x-hidden rounded-lg border border-border-app bg-background-primary py-1 shadow-lg sm:left-0 sm:right-auto sm:w-full",
          )}
          aria-label="Task search results"
        >
          {!loaded ? (
            <div className="px-3 py-2 text-sm text-[#888]">Loading…</div>
          ) : matches.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[#888]">
              No matching tasks.
            </div>
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
