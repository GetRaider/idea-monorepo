"use client";

import { useEffect, useState } from "react";

import {
  ConfirmDangerBtn,
  Dialog,
  DialogActions,
  DialogBody,
  DialogFormButton,
  DialogFormGroup,
  DialogFormLabel,
} from "@/components/Dialogs";
import type {
  CalendarEventKind,
  CalendarScheduledEvent,
} from "@/types/calendar.types";

import { kindLabel } from "./calendar-event-mapper";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  toLocalDateInputValue,
} from "./datetime-local";

type EditorMode = "create" | "edit";

interface CalendarEventEditorDialogProps {
  open: boolean;
  mode: EditorMode;
  initial: CalendarScheduledEvent | null;
  /** When creating from a calendar drag selection (end is inclusive). */
  createRange?: { start: Date; end: Date; allDay: boolean } | null;
  onClose: () => void;
  onSave: (event: CalendarScheduledEvent) => void;
  onDelete?: (id: string) => void;
}

interface Draft {
  title: string;
  kind: CalendarEventKind;
  start: string;
  end: string;
  allDay: boolean;
  taskScopeText: string;
  attendeesNote: string;
  linkedTaskSummary: string;
}

function emptyDraft(now: Date): Draft {
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    kind: "time_block",
    start: toDatetimeLocalValue(now),
    end: toDatetimeLocalValue(end),
    allDay: false,
    taskScopeText: "",
    attendeesNote: "",
    linkedTaskSummary: "",
  };
}

function fromScheduled(e: CalendarScheduledEvent): Draft {
  const start = new Date(e.start);
  const end = new Date(e.end);
  return {
    title: e.title,
    kind: e.kind,
    start: e.allDay
      ? `${toLocalDateInputValue(start)}T00:00`
      : toDatetimeLocalValue(start),
    end: e.allDay
      ? `${toLocalDateInputValue(end)}T00:00`
      : toDatetimeLocalValue(end),
    allDay: e.allDay,
    taskScopeText: (e.taskScope ?? []).join("\n"),
    attendeesNote: e.attendeesNote ?? "",
    linkedTaskSummary: e.linkedTaskSummary ?? "",
  };
}

function draftToScheduled(
  draft: Draft,
  id: string | undefined,
): CalendarScheduledEvent | null {
  if (!draft.title.trim()) return null;
  const taskScopeLines = draft.taskScopeText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let startIso: string;
  let endIso: string;

  if (draft.allDay) {
    const startDay = draft.start.slice(0, 10);
    const endDay = draft.end.slice(0, 10);
    const [sy, sm, sd] = startDay.split("-").map((x) => parseInt(x, 10));
    const [ey, em, ed] = endDay.split("-").map((x) => parseInt(x, 10));
    if (
      [sy, sm, sd, ey, em, ed].some((n) => Number.isNaN(n)) ||
      endDay < startDay
    ) {
      return null;
    }
    const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
    const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
    startIso = start.toISOString();
    endIso = end.toISOString();
  } else {
    const start = fromDatetimeLocalValue(draft.start);
    const end = fromDatetimeLocalValue(draft.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }
    if (end.getTime() <= start.getTime()) return null;
    startIso = start.toISOString();
    endIso = end.toISOString();
  }

  return {
    id: id ?? crypto.randomUUID(),
    kind: draft.kind,
    title: draft.title.trim(),
    start: startIso,
    end: endIso,
    allDay: draft.allDay,
    ...(taskScopeLines.length ? { taskScope: taskScopeLines } : {}),
    ...(draft.attendeesNote.trim()
      ? { attendeesNote: draft.attendeesNote.trim() }
      : {}),
    ...(draft.linkedTaskSummary.trim()
      ? { linkedTaskSummary: draft.linkedTaskSummary.trim() }
      : {}),
  };
}

export function CalendarEventEditorDialog({
  open,
  mode,
  initial,
  createRange,
  onClose,
  onSave,
  onDelete,
}: CalendarEventEditorDialogProps) {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(new Date()));

  useEffect(() => {
    if (!open) return;
    if (mode === "create" && createRange) {
      setDraft({
        title: "",
        kind: "time_block",
        start: createRange.allDay
          ? `${toLocalDateInputValue(createRange.start)}T00:00`
          : toDatetimeLocalValue(createRange.start),
        end: createRange.allDay
          ? `${toLocalDateInputValue(createRange.end)}T00:00`
          : toDatetimeLocalValue(createRange.end),
        allDay: createRange.allDay,
        taskScopeText: "",
        attendeesNote: "",
        linkedTaskSummary: "",
      });
      return;
    }
    if (initial) setDraft(fromScheduled(initial));
    else setDraft(emptyDraft(new Date()));
  }, [open, mode, initial, createRange]);

  if (!open) return null;

  const handleSave = () => {
    const next = draftToScheduled(draft, initial?.id);
    if (!next) return;
    onSave(next);
    onClose();
  };

  const handleDelete = () => {
    if (!initial || !onDelete) return;
    onDelete(initial.id);
    onClose();
  };

  const inputClass =
    "w-full rounded-lg border border-white/15 bg-input-bg px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]";

  return (
    <Dialog
      title={mode === "create" ? "New calendar event" : "Edit event"}
      subtitle="Time blocks, mutual events, and task timelines stay in sync on your calendar."
      onClose={onClose}
      maxWidth={520}
    >
      <DialogBody className="gap-4">
        <DialogFormGroup>
          <DialogFormLabel>Title</DialogFormLabel>
          <input
            className={inputClass}
            value={draft.title}
            onChange={(ev) =>
              setDraft((d) => ({ ...d, title: ev.target.value }))
            }
            placeholder="e.g. Gym Training, Team retro"
          />
        </DialogFormGroup>

        <DialogFormGroup>
          <DialogFormLabel>Type</DialogFormLabel>
          <select
            className={inputClass}
            value={draft.kind}
            onChange={(ev) =>
              setDraft((d) => ({
                ...d,
                kind: ev.target.value as CalendarEventKind,
              }))
            }
          >
            <option value="time_block">{kindLabel("time_block")}</option>
            <option value="mutual">{kindLabel("mutual")}</option>
            <option value="task_event">{kindLabel("task_event")}</option>
          </select>
        </DialogFormGroup>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={draft.allDay}
            onChange={(ev) =>
              setDraft((d) => ({ ...d, allDay: ev.target.checked }))
            }
            className="h-4 w-4 rounded border-white/20 bg-input-bg"
          />
          All-day
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DialogFormGroup>
            <DialogFormLabel>Start</DialogFormLabel>
            <input
              type={draft.allDay ? "date" : "datetime-local"}
              className={inputClass}
              value={draft.allDay ? draft.start.slice(0, 10) : draft.start}
              onChange={(ev) => {
                const v = ev.target.value;
                setDraft((d) =>
                  d.allDay
                    ? { ...d, start: `${v}T00:00`, end: `${v}T23:59` }
                    : { ...d, start: v },
                );
              }}
            />
          </DialogFormGroup>
          <DialogFormGroup>
            <DialogFormLabel>End</DialogFormLabel>
            <input
              type={draft.allDay ? "date" : "datetime-local"}
              className={inputClass}
              value={draft.allDay ? draft.end.slice(0, 10) : draft.end}
              onChange={(ev) => {
                const v = ev.target.value;
                setDraft((d) =>
                  d.allDay ? { ...d, end: `${v}T23:59` } : { ...d, end: v },
                );
              }}
            />
          </DialogFormGroup>
        </div>

        {draft.kind === "time_block" && (
          <DialogFormGroup>
            <DialogFormLabel>Task scope (one per line)</DialogFormLabel>
            <textarea
              className={`${inputClass} min-h-[88px] resize-y`}
              value={draft.taskScopeText}
              onChange={(ev) =>
                setDraft((d) => ({ ...d, taskScopeText: ev.target.value }))
              }
              placeholder="Tasks you want to complete in this block"
            />
          </DialogFormGroup>
        )}

        {draft.kind === "mutual" && (
          <DialogFormGroup>
            <DialogFormLabel>People / notes</DialogFormLabel>
            <input
              className={inputClass}
              value={draft.attendeesNote}
              onChange={(ev) =>
                setDraft((d) => ({ ...d, attendeesNote: ev.target.value }))
              }
              placeholder="Who is involved?"
            />
          </DialogFormGroup>
        )}

        {draft.kind === "task_event" && (
          <DialogFormGroup>
            <DialogFormLabel>Task summary</DialogFormLabel>
            <input
              className={inputClass}
              value={draft.linkedTaskSummary}
              onChange={(ev) =>
                setDraft((d) => ({ ...d, linkedTaskSummary: ev.target.value }))
              }
              placeholder="What you are executing in this window"
            />
          </DialogFormGroup>
        )}
      </DialogBody>

      <DialogActions className="flex flex-wrap justify-between gap-3">
        <div className="flex gap-2">
          {mode === "edit" && onDelete ? (
            <ConfirmDangerBtn type="button" onClick={handleDelete}>
              Delete
            </ConfirmDangerBtn>
          ) : null}
        </div>
        <div className="flex gap-2">
          <DialogFormButton type="button" onClick={onClose}>
            Cancel
          </DialogFormButton>
          <DialogFormButton type="button" primary onClick={handleSave}>
            Save
          </DialogFormButton>
        </div>
      </DialogActions>
    </Dialog>
  );
}
