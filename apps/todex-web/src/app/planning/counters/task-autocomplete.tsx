"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input, cn } from "@repo/ui";
import type { CounterDetail, Task } from "@repo/api/todex";

import { RepeatIcon, SearchIcon } from "@components/icons";
import { todexClient } from "@lib/todex-client";

import { useTasks } from "../tasks-provider";
import { linkCandidates } from "./counter-helpers";
import { SpaceDot } from "./space-dot";
import { useCounterActions } from "./use-counters";

/** Search field with a dropdown; stays open so several Tasks can be linked. */
export function TaskAutocomplete({ counter }: { counter: CounterDetail }) {
  const {
    state: { boards },
  } = useTasks();
  // Only Tasks of linked spaces can be picked.
  const spaceIds = boards
    .map((board) => board.id)
    .filter((id) => counter.spaceIds.includes(id));
  const isLocked = spaceIds.length === 0;
  const { addLink } = useCounterActions(counter.id);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const tasksQuery = useQuery({
    queryKey: ["tasks", "root", spaceIds.join("\n")],
    enabled: open && !isLocked,
    queryFn: () =>
      Promise.all(
        spaceIds.map((spaceId) => todexClient.tasks.list({ spaceId })),
      ).then((lists) => lists.flat()),
  });
  const candidates = linkCandidates(
    tasksQuery.data ?? [],
    counter.links,
    search,
  );
  const active = Math.min(highlighted, candidates.length - 1);
  const activeTask = candidates[active];

  function link(task: Task) {
    if (addLink.isPending) return;
    addLink.mutate(task.id);
    setSearch("");
    setHighlighted(0);
  }

  function move(step: number) {
    setOpen(true);
    if (candidates.length === 0) return;
    setHighlighted((active + step + candidates.length) % candidates.length);
  }

  function handleKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    }
    if (event.key === "Escape") setOpen(false);
    if (event.key === "Enter" && open && activeTask) {
      event.preventDefault();
      link(activeTask);
    }
  }

  function emptyMessage() {
    if (tasksQuery.isError) return "Could not load tasks.";
    if (tasksQuery.isLoading) return "Loading tasks…";
    return "No tasks to link.";
  }

  return (
    <div className="relative">
      <SearchIcon
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        className="h-10 rounded-lg bg-white/[0.04] pl-9"
        role="combobox"
        aria-label="Search tasks to link"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && activeTask ? `${listId}-${activeTask.id}` : undefined
        }
        autoComplete="off"
        disabled={isLocked}
        placeholder={isLocked ? "Link a space first" : "Search tasks to link…"}
        value={search}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKey}
        onChange={(event) => {
          setSearch(event.target.value);
          setHighlighted(0);
          setOpen(true);
        }}
      />
      {open && !isLocked ? (
        <div className="absolute inset-x-0 top-full z-20 mt-1 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
          <ul
            id={listId}
            role="listbox"
            aria-label="Tasks"
            className="max-h-64 overflow-auto"
          >
            {candidates.map((task, index) => (
              <li
                key={task.id}
                id={`${listId}-${task.id}`}
                ref={index === active ? revealOption : undefined}
                role="option"
                aria-selected={index === active}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                  index === active && "bg-surface",
                )}
                // Keeps focus in the field, so the dropdown does not close.
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => link(task)}
              >
                <SpaceDot
                  color={
                    boards.find((board) => board.id === task.spaceId)?.color
                  }
                />
                <span className="min-w-0 flex-1 truncate">{task.summary}</span>
                {task.seriesId ? <RepeatIcon size={12} /> : null}
                <span className="text-xs text-muted-foreground">
                  {task.taskKey}
                </span>
              </li>
            ))}
          </ul>
          {candidates.length === 0 ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">
              {emptyMessage()}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function revealOption(option: HTMLLIElement | null) {
  option?.scrollIntoView({ block: "nearest" });
}
