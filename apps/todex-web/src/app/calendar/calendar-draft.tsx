"use client";

import { useState, type ReactNode } from "react";
import { Button, Checkbox, Input, Label, cn } from "@repo/ui";
import type { Task, TaskBoard, TaskRecurrence } from "@repo/api/todex";

import { TaskRecurrencePicker } from "../tasks/task-recurrence-picker";
import { CalendarColorPicker } from "./calendar-color-picker";
import { DEFAULT_EVENT_COLOR } from "./calendar-colors";
import { TaskScopePicker } from "./calendar-task-scope";
import { withAllDay } from "./calendar-datetime";
import { CalendarWhenFields } from "./calendar-when";

export function CalendarDraft({
  draft,
  tasks,
  boards,
  onKind,
  onCancel,
  onCreate,
}: {
  draft: DraftSelection;
  tasks: Task[];
  boards: TaskBoard[];
  onKind: (kind: DraftKind) => void;
  onCancel: () => void;
  onCreate: (body: DraftCreate) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [allDay, setAllDay] = useState(draft.allDay);
  const [start, setStart] = useState(draft.start.toISOString());
  const [end, setEnd] = useState(draft.end.toISOString());
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null);
  const [taskScope, setTaskScope] = useState<string[]>([]);
  const [taskId, setTaskId] = useState("");
  const [pending, setPending] = useState(false);
  const rangeValid = Date.parse(start) < Date.parse(end);
  const canCreate =
    rangeValid &&
    (draft.kind === "event" ? title.trim().length > 0 : Boolean(taskId));

  function changeAllDay(next: boolean) {
    const range = withAllDay(start, end, next);
    setAllDay(next);
    setStart(range.start);
    setEnd(range.end);
  }

  return (
    <form
      className="calendar-draft absolute z-30 flex w-80 max-w-[calc(100%-1rem)] flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-popover p-3 shadow-lg"
      style={{ left: draft.left, top: draft.top, maxHeight: draft.maxHeight }}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canCreate || pending) return;
        setPending(true);
        const request =
          draft.kind === "task"
            ? onCreate({
                kind: "task",
                taskId,
                scheduleDate: start,
                ...(allDay
                  ? {}
                  : {
                      estimation: Math.max(
                        15,
                        Math.round((Date.parse(end) - Date.parse(start)) / 60_000),
                      ),
                    }),
              })
            : onCreate({
                kind: "event",
                title: title.trim(),
                start,
                end,
                allDay,
                color,
                recurrence,
                taskScope,
              });
        void request.finally(() => setPending(false));
      }}
    >
      <div className="flex rounded-lg bg-surface p-0.5">
        <button
          type="button"
          className={cn(
            "flex-1 rounded-md py-1 text-xs font-medium",
            draft.kind === "event" ? "bg-accent text-foreground" : "text-muted-foreground",
          )}
          onClick={() => onKind("event")}
        >
          Event
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 rounded-md py-1 text-xs font-medium",
            draft.kind === "task" ? "bg-accent text-foreground" : "text-muted-foreground",
          )}
          onClick={() => onKind("task")}
        >
          Task
        </button>
      </div>

      {draft.kind === "event" ? (
        <div className="flex items-center gap-2">
          <CalendarColorPicker
            color={color ?? DEFAULT_EVENT_COLOR}
            onChange={setColor}
          />
          <Input
            autoFocus
            value={title}
            placeholder="Name"
            aria-label="Name"
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
      ) : (
        <Field label="Task">
          <TaskScopePicker
            boards={boards}
            tasks={tasks}
            value={taskId ? [taskId] : []}
            selection="single"
            onChange={(taskIds) => setTaskId(taskIds[0] ?? "")}
          />
        </Field>
      )}

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={allDay}
          onCheckedChange={(checked) => changeAllDay(checked === true)}
        />
        All day
      </label>
      <CalendarWhenFields allDay={allDay} start={start} end={end} onStart={setStart} onEnd={setEnd} />

      {draft.kind === "event" ? (
        <>
          <Field label="Repeat">
            <TaskRecurrencePicker
              recurrence={recurrence}
              scheduleDate={start}
              dueDate={null}
              detail=""
              onChange={setRecurrence}
            />
          </Field>
          <Field label="Task scope">
            <TaskScopePicker
              boards={boards}
              tasks={tasks}
              value={taskScope}
              selection="multiple"
              onChange={setTaskScope}
            />
          </Field>
        </>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" variant="solid" disabled={!canCreate || pending}>
          {draft.kind === "task" ? "Schedule" : "Create"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export type DraftKind = "event" | "task";

export interface DraftSelection {
  start: Date;
  end: Date;
  allDay: boolean;
  kind: DraftKind;
  left: number;
  top: number;
  maxHeight: number;
}

export type DraftCreate =
  | {
      kind: "event";
      title: string;
      start: string;
      end: string;
      allDay: boolean;
      color: string | null;
      recurrence: TaskRecurrence | null;
      taskScope: string[];
    }
  | {
      kind: "task";
      taskId: string;
      scheduleDate: string;
      estimation?: number;
    };
