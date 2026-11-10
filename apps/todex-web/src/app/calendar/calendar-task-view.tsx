"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cn } from "@repo/ui";

import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { useCalendar } from "./calendar-provider";

export function CalendarTaskView() {
  const {
    state: { selectedEvent, selectedTaskId, selectedTask, tasks, boards },
    actions: { closeTask, openTask },
  } = useCalendar();
  const router = useRouter();
  const [spaceId, setSpaceId] = useState("");
  useEffect(() => {
    setSpaceId("");
  }, [selectedTaskId]);
  if (selectedEvent || !selectedTaskId) return null;
  const activeSpaceId =
    spaceId ||
    selectedTask?.spaceId ||
    boards.find((board) => board.name === "Inbox")?.id ||
    boards[0]?.id ||
    "";
  const board = boards.find((item) => item.id === activeSpaceId);
  const href =
    selectedTask && board && selectedTask.spaceId === board.id
      ? tasksUrlHelper.routing.buildBoardUrl(board.id, selectedTask.taskKey)
      : null;
  const spaceTasks = tasks.filter(
    (task) =>
      task.spaceId === activeSpaceId &&
      task.status !== "done" &&
      task.status !== "cancelled",
  );

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">Task</span>
        <Button type="button" size="sm" variant="ghost" onClick={closeTask}>
          Close
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 pb-10">
        <select
          aria-label="Space"
          value={activeSpaceId}
          className="h-8 w-full rounded-md border border-border bg-transparent px-2 text-sm"
          onChange={(event) => setSpaceId(event.target.value)}
        >
          {boards.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
          {spaceTasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                className={cn(
                  "w-full truncate rounded-lg border border-border px-2 py-1.5 text-left text-sm",
                  task.id === selectedTaskId && "bg-accent",
                )}
                onClick={() => openTask(task.id)}
              >
                <span className="text-muted-foreground">{task.taskKey}</span> {task.summary}
              </button>
            </li>
          ))}
          {spaceTasks.length === 0 ? (
            <li className="px-1 text-xs text-muted-foreground">No tasks in this space.</li>
          ) : null}
        </ul>
        {selectedTask ? (
          <>
            <h2 className="text-lg font-medium">{selectedTask.summary}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedTask.taskKey}
              {board && selectedTask.spaceId === board.id ? ` · ${board.name}` : ""}
            </p>
            <p className="text-sm">
              {selectedTask.scheduleDate
                ? new Date(selectedTask.scheduleDate).toLocaleString()
                : "Unscheduled"}
            </p>
            {selectedTask.description.trim() ? (
              <div
                className="text-sm leading-relaxed [&_p]:my-1"
                dangerouslySetInnerHTML={{ __html: selectedTask.description }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No description</p>
            )}
            {href ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={() => router.push(href)}
              >
                Open in Tasks
              </Button>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Task is not on a board.</p>
        )}
      </div>
    </aside>
  );
}
