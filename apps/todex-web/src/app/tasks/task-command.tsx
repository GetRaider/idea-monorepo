"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
} from "@repo/ui";

import { SearchIcon } from "@components/icons";
import { todexClient } from "@lib/todex-client";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { hrefForTask } from "./task-command.href";
import { useTasks } from "./tasks-provider";

export function TaskCommand() {
  const router = useRouter();
  const {
    state: { boards, view, tasks: loadedViewTasks },
  } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const toastedBoardIdsRef = useRef(new Set<string>());

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true']") &&
        !target.closest("[data-slot='command-input']")
      ) {
        return;
      }
      event.preventDefault();
      setIsOpen((current) => !current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const boardTaskQueries = useQueries({
    queries: boards.map((board) => ({
      queryKey: ["tasks", board.id],
      queryFn: () => todexClient.tasks.list({ boardId: board.id }),
      enabled: isOpen,
    })),
  });

  useEffect(() => {
    if (!isOpen) {
      toastedBoardIdsRef.current.clear();
      return;
    }
    boards.forEach((board, index) => {
      if (!boardTaskQueries[index]?.isError) return;
      if (toastedBoardIdsRef.current.has(board.id)) return;
      toastedBoardIdsRef.current.add(board.id);
      toast.error(`Could not load tasks for ${board.name}`);
    });
  }, [boards, boardTaskQueries, isOpen]);

  const paletteTasks = useMemo(
    () => boardTaskQueries.flatMap((query) => query.data ?? []),
    [boardTaskQueries],
  );
  const loadedViewTaskIds = useMemo(
    () => new Set(loadedViewTasks.map((task) => task.id)),
    [loadedViewTasks],
  );

  const go = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-9 gap-2 text-muted-foreground"
        onClick={() => setIsOpen(true)}
        aria-label="Search tasks"
      >
        <SearchIcon size={14} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-border px-1.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Button>
      {isOpen ? (
        <Dialog
          title="Search"
          onClose={() => setIsOpen(false)}
          maxWidth={480}
          showCloseButton={false}
        >
          <Command className="rounded-md border border-border">
            <CommandInput autoFocus placeholder="Boards, schedules, tasks…" />
            <CommandList>
              <CommandEmpty>No matching results.</CommandEmpty>
              <CommandGroup heading="Navigation">
                <CommandItem
                  value="schedule today"
                  onSelect={() =>
                    go(tasksUrlHelper.routing.buildScheduleUrl("today"))
                  }
                >
                  Today
                </CommandItem>
                <CommandItem
                  value="schedule tomorrow"
                  onSelect={() =>
                    go(tasksUrlHelper.routing.buildScheduleUrl("tomorrow"))
                  }
                >
                  Tomorrow
                </CommandItem>
              </CommandGroup>
              {boards.length > 0 ? (
                <CommandGroup heading="Boards">
                  {boards.map((board) => (
                    <CommandItem
                      key={board.id}
                      value={`board ${board.id} ${board.name}`}
                      onSelect={() =>
                        go(tasksUrlHelper.routing.buildBoardUrl(board.name))
                      }
                    >
                      {board.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {paletteTasks.length > 0 ? (
                <CommandGroup heading="Tasks">
                  {paletteTasks.map((task) => (
                    <CommandItem
                      key={task.id}
                      value={`${task.id} ${task.taskKey} ${task.summary}`}
                      onSelect={() =>
                        go(
                          hrefForTask(task, boards, view, loadedViewTaskIds),
                        )
                      }
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {task.taskKey}
                      </span>
                      <span className="min-w-0 truncate">{task.summary}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </Dialog>
      ) : null}
    </>
  );
}
