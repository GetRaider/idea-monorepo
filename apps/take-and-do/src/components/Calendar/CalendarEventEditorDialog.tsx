"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ConfirmDangerBtn,
  Dialog,
  DialogActions,
  DialogBody,
  DialogFormButton,
  DialogFormGroup,
  DialogFormLabel,
} from "@/components/Dialogs";
import { Dropdown } from "@/components/Dropdown";
import { Input } from "@/components/Input";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import type {
  CalendarCreatePrefill,
  CalendarEventKind,
  CalendarScheduledEvent,
} from "@/types/calendar.types";

import { CalendarEventTaskSection } from "./CalendarEventTaskSection";
import { CalendarEventTaskScopeSection } from "./CalendarEventTaskScopeSection";
import { kindLabel } from "./calendar-event-mapper";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  toLocalDateInputValue,
} from "./datetime-local";
import { timeZoneOptions } from "./timezones";

type EditorMode = "create" | "edit";

interface CalendarEventEditorDialogProps {
  open: boolean;
  mode: EditorMode;
  initial: CalendarScheduledEvent | null;
  createRange?: { start: Date; end: Date; allDay: boolean } | null;
  createPrefill?: CalendarCreatePrefill | null;
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
  taskScope: string[];
  attendeesNote: string;
  linkedTaskSummary: string;
  descriptionText: string;
  notesAndDocsText: string;
  participantsText: string;
  timeZone: string;
  repeat: string;
  meetingUrlText: string;
  taskBoardId: string;
  taskId: string;
  taskSummarySnapshot: string;
}

function emptyDraft(now: Date): Draft {
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    kind: "time_block",
    start: toDatetimeLocalValue(now),
    end: toDatetimeLocalValue(end),
    allDay: false,
    taskScope: [],
    attendeesNote: "",
    linkedTaskSummary: "",
    descriptionText: "",
    notesAndDocsText: "",
    participantsText: "",
    timeZone: "",
    repeat: "",
    meetingUrlText: "",
    taskBoardId: "",
    taskId: "",
    taskSummarySnapshot: "",
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
    taskScope: e.taskScope ?? [],
    attendeesNote: e.attendeesNote ?? "",
    linkedTaskSummary: e.linkedTaskSummary ?? "",
    descriptionText: e.description ?? "",
    notesAndDocsText: e.notesAndDocs ?? "",
    participantsText: (e.participants ?? []).join(", "),
    timeZone: e.timeZone ?? "",
    repeat: e.repeat ?? "",
    meetingUrlText: e.meetingUrl ?? "",
    taskBoardId: e.taskBoardId ?? "",
    taskId: e.taskId ?? "",
    taskSummarySnapshot: e.taskSummarySnapshot ?? "",
  };
}

function draftToScheduled(
  draft: Draft,
  id: string | undefined,
  preserve: CalendarScheduledEvent | null,
): CalendarScheduledEvent | null {
  if (!draft.title.trim()) return null;
  if (draft.kind === "task_event") {
    if (!draft.taskBoardId.trim() || !draft.taskId.trim()) {
      return null;
    }
  }
  const taskScopeLines = draft.taskScope.map((t) => t.trim()).filter(Boolean);
  const participants = draft.participantsText
    .split(",")
    .map((p) => p.trim())
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

  const base: CalendarScheduledEvent = {
    id: id ?? crypto.randomUUID(),
    kind: draft.kind,
    title: draft.title.trim().slice(0, 200),
    start: startIso,
    end: endIso,
    allDay: draft.allDay,
    ...(draft.timeZone.trim() ? { timeZone: draft.timeZone.trim() } : {}),
    ...(draft.repeat.trim() ? { repeat: draft.repeat.trim() } : {}),
    ...(draft.meetingUrlText.trim()
      ? { meetingUrl: draft.meetingUrlText.trim() }
      : {}),
    ...(participants.length ? { participants } : {}),
    ...(draft.notesAndDocsText.trim()
      ? { notesAndDocs: draft.notesAndDocsText.trim() }
      : {}),
    ...(taskScopeLines.length ? { taskScope: taskScopeLines } : {}),
    ...(draft.attendeesNote.trim()
      ? { attendeesNote: draft.attendeesNote.trim() }
      : {}),
    ...(draft.kind === "task_event"
      ? {
          taskBoardId: draft.taskBoardId.trim(),
          taskId: draft.taskId.trim(),
          ...(draft.taskSummarySnapshot.trim()
            ? { taskSummarySnapshot: draft.taskSummarySnapshot.trim() }
            : {}),
        }
      : {}),
    ...(draft.kind !== "task_event" && draft.linkedTaskSummary.trim()
      ? { linkedTaskSummary: draft.linkedTaskSummary.trim() }
      : {}),
    description: draft.descriptionText.trim() || undefined,
  };

  if (preserve) {
    return {
      ...base,
      rsvpStatus: preserve.rsvpStatus,
      rsvpDeclineReason: preserve.rsvpDeclineReason,
    };
  }

  return base;
}

export function CalendarEventEditorDialog({
  open,
  mode,
  initial,
  createRange,
  createPrefill,
  onClose,
  onSave,
  onDelete,
}: CalendarEventEditorDialogProps) {
  const isGuest = useIsAnonymous();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(new Date()));

  useEffect(() => {
    if (!open) return;
    if (mode === "create" && createRange) {
      setDraft({
        title: createPrefill?.title ?? "",
        kind: createPrefill?.kind ?? "time_block",
        start: createRange.allDay
          ? `${toLocalDateInputValue(createRange.start)}T00:00`
          : toDatetimeLocalValue(createRange.start),
        end: createRange.allDay
          ? `${toLocalDateInputValue(createRange.end)}T00:00`
          : toDatetimeLocalValue(createRange.end),
        allDay: createRange.allDay,
        taskScope: [],
        attendeesNote: "",
        linkedTaskSummary: "",
        descriptionText: createPrefill?.description ?? "",
        notesAndDocsText: "",
        participantsText: "",
        timeZone: "",
        repeat: "",
        meetingUrlText: "",
        taskBoardId: "",
        taskId: "",
        taskSummarySnapshot: "",
      });
      return;
    }
    if (mode === "create" && createPrefill && !createRange) {
      const now = new Date();
      setDraft({
        ...emptyDraft(now),
        title: createPrefill.title ?? "",
        kind: createPrefill.kind ?? "time_block",
        descriptionText: createPrefill.description ?? "",
      });
      return;
    }
    if (initial) setDraft(fromScheduled(initial));
    else setDraft(emptyDraft(new Date()));
  }, [open, mode, initial, createRange, createPrefill]);

  if (!open) return null;

  const handleSave = () => {
    const next = draftToScheduled(draft, initial?.id, initial);
    if (!next) {
      if (draft.kind === "task_event") {
        toast.error(
          "Pick a board and a task, or create one with quick-create.",
        );
      }
      return;
    }
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
      title={mode === "create" ? "Create event" : "Edit event"}
      subtitle="Time blocks, general events, and task windows stay on this calendar."
      onClose={onClose}
      maxWidth={520}
    >
      <DialogBody className="gap-4">
        <DialogFormGroup>
          <DialogFormLabel>Title</DialogFormLabel>
          <Input
            className="rounded-lg"
            value={draft.title}
            onChange={(ev) =>
              setDraft((d) => ({ ...d, title: ev.target.value }))
            }
            placeholder="e.g. Gym Training, Team retro"
            maxLength={200}
          />
        </DialogFormGroup>

        <DialogFormGroup>
          <DialogFormLabel>Type</DialogFormLabel>
          <Dropdown<CalendarEventKind>
            options={[
              { value: "time_block", label: kindLabel("time_block") },
              { value: "general", label: kindLabel("general") },
              { value: "task_event", label: kindLabel("task_event") },
            ]}
            value={draft.kind}
            onChange={(kind) => setDraft((d) => ({ ...d, kind }))}
            fullWidth
          />
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DialogFormGroup>
            <DialogFormLabel>Time zone</DialogFormLabel>
            <Dropdown<string>
              options={timeZoneOptions()}
              value={draft.timeZone}
              onChange={(timeZone) => setDraft((d) => ({ ...d, timeZone }))}
              fullWidth
            />
          </DialogFormGroup>
          <DialogFormGroup>
            <DialogFormLabel>Repeat</DialogFormLabel>
            <Dropdown<string>
              options={[
                { value: "", label: "Does not repeat" },
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
              ]}
              value={draft.repeat}
              onChange={(repeat) => setDraft((d) => ({ ...d, repeat }))}
              fullWidth
            />
          </DialogFormGroup>
        </div>

        <DialogFormGroup>
          <DialogFormLabel>Participants</DialogFormLabel>
          <Input
            value={draft.participantsText}
            onChange={(e) =>
              setDraft((d) => ({ ...d, participantsText: e.target.value }))
            }
            placeholder="Add participants (comma-separated)"
            maxLength={128}
          />
        </DialogFormGroup>

        <DialogFormGroup>
          <DialogFormLabel>Meeting URL</DialogFormLabel>
          <Input
            value={draft.meetingUrlText}
            onChange={(e) =>
              setDraft((d) => ({ ...d, meetingUrlText: e.target.value }))
            }
            placeholder="Add meeting link"
            maxLength={256}
          />
        </DialogFormGroup>

        <DialogFormGroup>
          <DialogFormLabel>Notes &amp; Docs</DialogFormLabel>
          <Input
            value={draft.notesAndDocsText}
            onChange={(e) =>
              setDraft((d) => ({ ...d, notesAndDocsText: e.target.value }))
            }
            placeholder="Add link or note"
            maxLength={256}
          />
        </DialogFormGroup>

        <DialogFormGroup>
          <DialogFormLabel>Description</DialogFormLabel>
          <textarea
            className={`${inputClass} min-h-[80px] resize-y`}
            value={draft.descriptionText}
            onChange={(ev) =>
              setDraft((d) => ({ ...d, descriptionText: ev.target.value }))
            }
            placeholder="Add details"
          />
        </DialogFormGroup>

        {draft.kind === "time_block" && (
          <CalendarEventTaskScopeSection
            value={draft.taskScope}
            onChange={(next) => setDraft((d) => ({ ...d, taskScope: next }))}
            disabled={isGuest}
          />
        )}

        {draft.kind === "general" && (
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
          <CalendarEventTaskSection
            taskBoardId={draft.taskBoardId}
            taskId={draft.taskId}
            isGuest={isGuest}
            inputClass={inputClass}
            onBoardChange={(boardId) =>
              setDraft((d) => ({
                ...d,
                taskBoardId: boardId,
                taskId: "",
                taskSummarySnapshot: "",
              }))
            }
            onTaskChange={(tid, snap) =>
              setDraft((d) => ({
                ...d,
                taskId: tid,
                taskSummarySnapshot: snap,
              }))
            }
            onTitleSync={(summary) =>
              setDraft((d) => (!d.title.trim() ? { ...d, title: summary } : d))
            }
          />
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
