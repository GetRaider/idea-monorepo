"use client";

import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";

import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { CalendarColorPicker } from "./calendar-color-picker";
import { DEFAULT_TASK_COLOR } from "./calendar-colors";
import { useCalendar } from "./calendar-provider";

export function CalendarTaskView() {
  const {
    state: { selectedEvent, selectedTaskId, selectedTask, boards },
    actions: { closeTask, updateTask },
  } = useCalendar();
  const router = useRouter();
  if (selectedEvent || !selectedTaskId) return null;
  const board = boards.find((item) => item.id === selectedTask?.taskBoardId);
  const href =
    selectedTask && board
      ? tasksUrlHelper.routing.buildBoardUrl(board.name, selectedTask.taskKey)
      : null;

  return (
    <aside className="flex w-[22rem] shrink-0 flex-col border-l border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">Task</span>
        <Button type="button" size="sm" variant="ghost" onClick={closeTask}>
          Close
        </Button>
      </div>
      {selectedTask ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          <div className="flex items-center gap-2">
            <CalendarColorPicker
              color={selectedTask.color ?? DEFAULT_TASK_COLOR}
              onChange={(color) => void updateTask(selectedTask.id, { color })}
            />
            <h2 className="text-lg font-medium">{selectedTask.summary}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedTask.taskKey}
            {board ? ` · ${board.name}` : ""}
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
              className="mt-auto w-fit"
              onClick={() => router.push(href)}
            >
              Open in Tasks
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="p-3 text-sm text-muted-foreground">Task is not on a board.</p>
      )}
    </aside>
  );
}
