"use client";

import { useState, type ReactNode, type Ref } from "react";
import { Button, Input } from "@repo/ui";
import type { Space, Task } from "@repo/api/todex";

import { CloseIcon } from "@components/icons";
import {
  combineLocalDateAndTime,
  isoToDateInput,
  isoToLocalTimeInput,
} from "../planning/task-helpers";

import { TaskScopePicker } from "./calendar-task-scope";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

export function CalendarDraft({
  ref,
  draft,
  tasks,
  boards,
  onRange,
  onKind,
  onCancel,
  onMore,
  onCreate,
}: {
  ref?: Ref<HTMLFormElement>;
  draft: DraftSelection;
  tasks: Task[];
  boards: Space[];
  onRange: (start: Date, end: Date) => void;
  onKind: (kind: DraftKind) => void;
  onCancel: () => void;
  onMore: (fields: DraftFields) => void;
  onCreate: (body: DraftCreate) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [taskId, setTaskId] = useState("");
  const [pending, setPending] = useState(false);
  const startIso = draft.start.toISOString();
  const endIso = draft.end.toISOString();
  const minutes = Math.max(
    15,
    Math.round((draft.end.getTime() - draft.start.getTime()) / 60_000),
  );
  const durationChoices = DURATION_OPTIONS.some((option) => option === minutes)
    ? DURATION_OPTIONS
    : [minutes, ...DURATION_OPTIONS].sort((left, right) => left - right);
  const canCreate = draft.kind === "event" ? title.trim().length > 0 : Boolean(taskId);

  function applyRange(dateValue: string, timeValue: string, durationMinutes: number) {
    const iso = combineLocalDateAndTime(dateValue, timeValue || "00:00");
    if (!iso) return;
    const start = new Date(iso);
    onRange(start, new Date(start.getTime() + durationMinutes * 60_000));
  }

  return (
    <form
      ref={ref}
      className="calendar-draft absolute z-30 flex w-[22rem] max-w-[calc(100%-1rem)] flex-col gap-3 rounded-xl border border-border bg-popover p-3 shadow-lg"
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
                scheduleDate: startIso,
                ...(draft.allDay ? {} : { estimation: minutes }),
              })
            : onCreate({
                kind: "event",
                title: title.trim(),
                start: startIso,
                end: endIso,
                allDay: draft.allDay,
              });
        void request.finally(() => setPending(false));
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">New event</span>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label="Close"
          onClick={onCancel}
        >
          <CloseIcon size={14} />
        </button>
      </div>
      {draft.kind === "event" ? (
        <Input
          autoFocus
          value={title}
          placeholder="Event title"
          aria-label="Event title"
          onChange={(event) => setTitle(event.target.value)}
        />
      ) : (
        <TaskScopePicker
          boards={boards}
          tasks={tasks}
          value={taskId ? [taskId] : []}
          selection="single"
          onChange={(taskIds) => setTaskId(taskIds[0] ?? "")}
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Date">
          <input
            type="date"
            aria-label="Date"
            value={isoToDateInput(startIso)}
            className="h-9 w-full rounded-md border border-border bg-transparent px-2 text-sm"
            onChange={(event) =>
              applyRange(event.target.value, isoToLocalTimeInput(startIso), minutes)
            }
          />
        </Field>
        <Field label="Start">
          <input
            type="time"
            aria-label="Start"
            disabled={draft.allDay}
            value={isoToLocalTimeInput(startIso)}
            className="h-9 w-full rounded-md border border-border bg-transparent px-2 text-sm disabled:opacity-40"
            onChange={(event) =>
              applyRange(isoToDateInput(startIso), event.target.value, minutes)
            }
          />
        </Field>
        <Field label="Duration">
          <select
            aria-label="Duration"
            disabled={draft.allDay}
            value={minutes}
            className="h-9 w-full rounded-md border border-border bg-transparent px-2 text-sm disabled:opacity-40"
            onChange={(event) =>
              applyRange(
                isoToDateInput(startIso),
                isoToLocalTimeInput(startIso),
                Number(event.target.value),
              )
            }
          >
            {durationChoices.map((choice) => (
              <option key={choice} value={choice}>
                {choice} min
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select
            aria-label="Type"
            value={draft.kind}
            className="h-9 w-full rounded-md border border-border bg-transparent px-2 text-sm"
            onChange={(event) =>
              onKind(event.target.value === "task" ? "task" : "event")
            }
          >
            <option value="event">Event</option>
            <option value="task">Task</option>
          </select>
        </Field>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-sm text-primary"
          onClick={() =>
            onMore({
              title: title.trim(),
              taskId,
              kind: draft.kind,
              start: startIso,
              end: endIso,
              allDay: draft.allDay,
            })
          }
        >
          More options
        </button>
        <Button type="submit" size="sm" variant="solid" disabled={!canCreate || pending}>
          Create
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
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

export interface DraftFields {
  title: string;
  taskId: string;
  kind: DraftKind;
  start: string;
  end: string;
  allDay: boolean;
}

export type DraftCreate =
  | {
      kind: "event";
      title: string;
      start: string;
      end: string;
      allDay: boolean;
    }
  | {
      kind: "task";
      taskId: string;
      scheduleDate: string;
      estimation?: number;
    };
