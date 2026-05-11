"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  ConfirmDialog,
  Dialog,
  DialogActions,
  DialogBody,
  DialogFormButton,
  DialogFormGroup,
  DialogFormLabel,
} from "@/components/Dialogs";
import { TrashIcon } from "@/components/Icons";
import { DeleteButton } from "@/components/TaskView/TaskView.ui";
import { Dropdown } from "@/components/Dropdown";
import { Input } from "@/components/Input";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import type {
  CalendarCreatePrefill,
  CalendarEvent,
  CalendarEventType,
  CalendarRepeatValue,
  CalendarTimeZone,
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
  initial: CalendarEvent | null;
  createRange?: { start: Date; end: Date; allDay: boolean } | null;
  createPrefill?: CalendarCreatePrefill | null;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
}

interface Draft {
  title: string;
  type: CalendarEventType;
  start: string;
  end: string;
  allDay: boolean;
  reminderMinutes: string;
  taskScope: string[];
  descriptionText: string;
  notesText: string;
  participantsText: string;
  timeZone: CalendarTimeZone;
  repeat: CalendarRepeatValue;
  meetingUrlText: string;
  taskBoardId: string;
  taskId: string;
  taskSummarySnapshot: string;
}

function emptyDraft(now: Date): Draft {
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  return {
    title: "",
    type: "timeBlock",
    start: toDatetimeLocalValue(now),
    end: toDatetimeLocalValue(end),
    allDay: false,
    reminderMinutes: "",
    taskScope: [],
    descriptionText: "",
    notesText: "",
    participantsText: "",
    timeZone: "",
    repeat: "",
    meetingUrlText: "",
    taskBoardId: "",
    taskId: "",
    taskSummarySnapshot: "",
  };
}

function fromScheduled(e: CalendarEvent): Draft {
  const start = new Date(e.start);
  const end = new Date(e.end);
  return {
    title: e.title,
    type: e.type,
    start: e.allDay
      ? `${toLocalDateInputValue(start)}T00:00`
      : toDatetimeLocalValue(start),
    end: e.allDay
      ? `${toLocalDateInputValue(end)}T00:00`
      : toDatetimeLocalValue(end),
    allDay: e.allDay,
    reminderMinutes:
      typeof e.reminderMinutes === "number" ? String(e.reminderMinutes) : "",
    taskScope: e.type === "timeBlock" ? (e.taskScope ?? []) : [],
    descriptionText: e.description ?? "",
    notesText: e.type !== "task" ? (e.notes ?? "") : "",
    participantsText:
      e.type !== "task" ? (e.participants ?? []).join(", ") : "",
    timeZone: e.timeZone ?? "",
    repeat: e.repeat ?? "",
    meetingUrlText: e.type !== "task" ? (e.meetingUrl ?? "") : "",
    taskBoardId: e.type === "task" ? e.taskBoardId : "",
    taskId: e.type === "task" ? e.taskId : "",
    taskSummarySnapshot: e.type === "task" ? (e.taskSummarySnapshot ?? "") : "",
  };
}

function draftToScheduled(
  draft: Draft,
  id: string | undefined,
  preserve: CalendarEvent | null,
): CalendarEvent | null {
  if (!draft.title.trim()) return null;
  if (draft.type === "task") {
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

  const base = {
    id: id ?? crypto.randomUUID(),
    title: draft.title.trim().slice(0, 200),
    start: startIso,
    end: endIso,
    allDay: draft.allDay,
    ...(draft.reminderMinutes.trim() &&
    !Number.isNaN(Number(draft.reminderMinutes)) &&
    Number(draft.reminderMinutes) >= 0
      ? { reminderMinutes: Number(draft.reminderMinutes) }
      : {}),
    ...(draft.timeZone.trim() ? { timeZone: draft.timeZone.trim() } : {}),
    ...(draft.repeat ? { repeat: draft.repeat } : {}),
    ...(draft.meetingUrlText.trim()
      ? { meetingUrl: draft.meetingUrlText.trim() }
      : {}),
    ...(participants.length ? { participants } : {}),
    ...(draft.notesText.trim() ? { notes: draft.notesText.trim() } : {}),
    description: draft.descriptionText.trim() || undefined,
  } as const;

  const event: CalendarEvent =
    draft.type === "task"
      ? {
          ...base,
          type: "task",
          taskBoardId: draft.taskBoardId.trim(),
          taskId: draft.taskId.trim(),
          ...(draft.taskSummarySnapshot.trim()
            ? { taskSummarySnapshot: draft.taskSummarySnapshot.trim() }
            : {}),
        }
      : draft.type === "timeBlock"
        ? {
            ...base,
            type: "timeBlock",
            ...(taskScopeLines.length ? { taskScope: taskScopeLines } : {}),
            ...(draft.notesText.trim()
              ? { notes: draft.notesText.trim() }
              : {}),
          }
        : {
            ...base,
            type: "common",
            ...(draft.notesText.trim()
              ? { notes: draft.notesText.trim() }
              : {}),
          };

  if (preserve) {
    return {
      ...event,
      ...(preserve.type === "common"
        ? {
            rsvpStatus: preserve.rsvpStatus,
            rsvpDeclineReason: preserve.rsvpDeclineReason,
          }
        : {}),
    };
  }

  return event;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "create" && createRange) {
      setDraft({
        title: createPrefill?.title ?? "",
        type: createPrefill?.type ?? "timeBlock",
        start: createRange.allDay
          ? `${toLocalDateInputValue(createRange.start)}T00:00`
          : toDatetimeLocalValue(createRange.start),
        end: createRange.allDay
          ? `${toLocalDateInputValue(createRange.end)}T00:00`
          : toDatetimeLocalValue(createRange.end),
        allDay: createRange.allDay,
        reminderMinutes: "",
        taskScope: [],
        descriptionText: createPrefill?.description ?? "",
        notesText: "",
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
        type: createPrefill.type ?? "timeBlock",
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
      if (draft.type === "task") {
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
      headerBeforeClose={
        mode === "edit" && onDelete ? (
          <DeleteButton
            type="button"
            title="Delete event"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-8 w-8 rounded-md"
          >
            <TrashIcon size={16} />
          </DeleteButton>
        ) : null
      }
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
          <Dropdown<CalendarEventType>
            options={[
              { value: "timeBlock", label: kindLabel("timeBlock") },
              { value: "common", label: kindLabel("common") },
              { value: "task", label: kindLabel("task") },
            ]}
            value={draft.type}
            onChange={(type) => setDraft((d) => ({ ...d, type }))}
            fullWidth
          />
        </DialogFormGroup>

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

        <DialogFormGroup>
          <DialogFormLabel>Description</DialogFormLabel>
          <textarea
            className={`${inputClass} min-h-[80px] resize-y`}
            value={draft.descriptionText}
            onChange={(ev) =>
              setDraft((d) => ({ ...d, descriptionText: ev.target.value }))
            }
            placeholder="Feel free to mention task or docs by @"
          />
        </DialogFormGroup>

        <details className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
          <summary className="cursor-pointer select-none text-sm font-medium text-zinc-200">
            Details
          </summary>

          <div className="mt-3 flex flex-col gap-4">
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
                <DialogFormLabel>Time zone</DialogFormLabel>
                <Dropdown<CalendarTimeZone>
                  options={timeZoneOptions()}
                  value={draft.timeZone}
                  onChange={(timeZone) => setDraft((d) => ({ ...d, timeZone }))}
                  fullWidth
                />
              </DialogFormGroup>
              <DialogFormGroup>
                <DialogFormLabel>Repeat</DialogFormLabel>
                <Dropdown<CalendarRepeatValue>
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
              <DialogFormLabel>Reminder</DialogFormLabel>
              <Dropdown<string>
                options={[
                  { value: "", label: "None" },
                  { value: "5", label: "5 min before" },
                  { value: "10", label: "10 min before" },
                  { value: "30", label: "30 min before" },
                  { value: "60", label: "1 hour before" },
                ]}
                value={draft.reminderMinutes}
                onChange={(reminderMinutes) =>
                  setDraft((d) => ({ ...d, reminderMinutes }))
                }
                fullWidth
              />
            </DialogFormGroup>

            {draft.type !== "task" ? (
              <>
                <DialogFormGroup>
                  <DialogFormLabel>Participants</DialogFormLabel>
                  <Input
                    value={draft.participantsText}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        participantsText: e.target.value,
                      }))
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
                      setDraft((d) => ({
                        ...d,
                        meetingUrlText: e.target.value,
                      }))
                    }
                    placeholder="Add meeting link"
                    maxLength={256}
                  />
                </DialogFormGroup>

                <DialogFormGroup>
                  <DialogFormLabel>Notes</DialogFormLabel>
                  <Input
                    value={draft.notesText}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, notesText: e.target.value }))
                    }
                    placeholder="Add a note"
                    maxLength={256}
                  />
                </DialogFormGroup>
              </>
            ) : null}

            {draft.type === "timeBlock" ? (
              <CalendarEventTaskScopeSection
                value={draft.taskScope}
                onChange={(next) =>
                  setDraft((d) => ({ ...d, taskScope: next }))
                }
                disabled={isGuest}
              />
            ) : null}

            {draft.type === "task" ? (
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
                  setDraft((d) =>
                    !d.title.trim() ? { ...d, title: summary } : d,
                  )
                }
              />
            ) : null}
          </div>
        </details>

        {/* attendeesNote removed */}
      </DialogBody>

      <DialogActions className="flex flex-wrap justify-end gap-3">
        <DialogFormButton type="button" onClick={onClose}>
          Cancel
        </DialogFormButton>
        <DialogFormButton type="button" primary onClick={handleSave}>
          Save
        </DialogFormButton>
      </DialogActions>

      {showDeleteConfirm && initial && onDelete ? (
        <ConfirmDialog
          title="Delete event?"
          description="This will permanently delete this event. This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setShowDeleteConfirm(false)}
          maxWidth={520}
        />
      ) : null}
    </Dialog>
  );
}
