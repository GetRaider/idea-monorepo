"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from "@repo/ui";
import type { CounterDetail } from "@repo/api/todex";

import { CloseIcon, PlusIcon, RepeatIcon } from "@components/icons";
import { todexClient } from "@lib/todex-client";

import { useTasks } from "../tasks-provider";
import { linkCandidates } from "./counter-helpers";
import { useCounterActions } from "./use-counters";

export function CounterLinks({ counter }: { counter: CounterDetail }) {
  const { removeLink, update } = useCounterActions(counter.id);
  const {
    state: { boards },
  } = useTasks();
  const space = boards.find((board) => board.id === counter.spaceId);

  return (
    <section aria-labelledby="counter-links-heading">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id="counter-links-heading" className="text-sm font-medium">
          Linked tasks
        </h2>
        <LinkTaskPicker counter={counter} />
      </div>
      {space ? (
        <label className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2 text-sm">
          Any task completed in {space.name} counts
          <Switch
            checked={counter.countsSpaceTasks}
            disabled={update.isPending}
            onCheckedChange={(countsSpaceTasks) =>
              update.mutate({ countsSpaceTasks })
            }
            aria-label={`Any task completed in ${space.name} counts`}
          />
        </label>
      ) : null}
      {counter.links.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Link a task and completing it counts here.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {counter.links.map((link) => (
            <li key={link.id} className="flex items-center gap-3 px-4 py-2">
              <span className="min-w-0 flex-1 truncate text-sm">
                {link.title}
              </span>
              {link.kind === "series" ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RepeatIcon size={12} />
                  Repeating
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {link.taskKey}
                </span>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground"
                aria-label={`Unlink ${link.title}`}
                disabled={removeLink.isPending}
                onClick={() => removeLink.mutate(link.id)}
              >
                <CloseIcon size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LinkTaskPicker({ counter }: { counter: CounterDetail }) {
  const {
    state: { boards },
  } = useTasks();
  const { addLink } = useCounterActions(counter.id);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Same key as the sidebar counts, so the list is usually already cached.
  const tasksQuery = useQuery({
    queryKey: ["tasks", "root", boards.map((board) => board.id).join("\n")],
    enabled: open && boards.length > 0,
    queryFn: () =>
      Promise.all(
        boards.map((board) => todexClient.tasks.list({ spaceId: board.id })),
      ).then((lists) => lists.flat()),
  });
  const candidates = linkCandidates(
    tasksQuery.data ?? [],
    counter.links,
    search,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost">
          <PlusIcon size={14} />
          Link task
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <Input
          autoFocus
          aria-label="Search tasks"
          placeholder="Search tasks"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <ul className="mt-2 max-h-64 overflow-auto">
          {candidates.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                disabled={addLink.isPending}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface"
                onClick={() =>
                  addLink.mutate(task.id, {
                    onSuccess: () => {
                      setOpen(false);
                      setSearch("");
                    },
                  })
                }
              >
                <span className="min-w-0 flex-1 truncate">{task.summary}</span>
                {task.seriesId ? <RepeatIcon size={12} /> : null}
                <span className="text-xs text-muted-foreground">
                  {task.taskKey}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {tasksQuery.isSuccess && candidates.length === 0 ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">
            No tasks to link.
          </p>
        ) : null}
        {tasksQuery.isError ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">
            Could not load tasks.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
