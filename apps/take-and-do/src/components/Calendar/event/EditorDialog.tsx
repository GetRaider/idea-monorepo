"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog, Dialog } from "@/components/Dialogs";
import { TrashIcon } from "@/components/Icons";
import { DeleteButton } from "@/components/TaskView/TaskView.ui";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import type {
  CalendarCreatePrefill,
  CalendarEvent,
} from "@/types/calendar.types";

import { EditorForm } from "./EditorForm";
import {
  type CommonCreateDestination,
  calendarEventToEditorDraft,
  editorDraftToScheduledEvent,
  emptyCalendarEventEditorDraft,
} from "./editorDraft";
import {
  effectiveKindColor,
  normalizeHexColor,
} from "@/helpers/calendar/calendar-colors";
import { calendarCommonEventUsesGoogleCalendar } from "@/helpers/calendar/calendar-event-mapper";
import {
  toDatetimeLocalValue,
  toLocalDateInputValue,
} from "@/helpers/calendar/datetime-local";

type EditorMode = "create" | "edit";

interface CalendarEventEditorDialogProps {
  open: boolean;
  mode: EditorMode;
  initial: CalendarEvent | null;
  createRange?: { start: Date; end: Date; allDay: boolean } | null;
  createPrefill?: CalendarCreatePrefill | null;
  googleCalendarConnected?: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent, opts?: { saveToGoogle?: boolean }) => void;
  onDeleteRequest?: (event: CalendarEvent) => void;
}

export function CalendarEventEditorDialog({
  open,
  mode,
  initial,
  createRange,
  createPrefill,
  googleCalendarConnected,
  onClose,
  onSave,
  onDeleteRequest,
}: CalendarEventEditorDialogProps) {
  const isGuest = useIsAnonymous();
  const [draft, setDraft] = useState(() =>
    emptyCalendarEventEditorDraft(new Date()),
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commonCreateDestination, setCommonCreateDestination] =
    useState<CommonCreateDestination>("internal");

  useEffect(() => {
    if (!open || mode !== "create") return;
    setCommonCreateDestination(
      googleCalendarConnected &&
        createPrefill?.type === "common" &&
        createPrefill?.saveToGoogle
        ? "google"
        : "internal",
    );
  }, [open, mode, createPrefill, googleCalendarConnected]);

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
        taskScope: [...(createPrefill?.taskScope ?? [])],
        descriptionText: createPrefill?.description ?? "",
        notesText: "",
        participantsText: "",
        timeZone: "",
        repeat: "",
        meetingUrlText: "",
        taskBoardId: "",
        taskId: "",
        taskSummarySnapshot: "",
        colorHex: normalizeHexColor(createPrefill?.color) ?? "",
      });
      return;
    }
    if (mode === "create" && createPrefill && !createRange) {
      const now = new Date();
      setDraft({
        ...emptyCalendarEventEditorDraft(now),
        title: createPrefill.title ?? "",
        type: createPrefill.type ?? "timeBlock",
        descriptionText: createPrefill.description ?? "",
        taskScope: [...(createPrefill.taskScope ?? [])],
        colorHex: normalizeHexColor(createPrefill.color) ?? "",
      });
      return;
    }
    if (initial) setDraft(calendarEventToEditorDraft(initial));
    else setDraft(emptyCalendarEventEditorDraft(new Date()));
  }, [open, mode, initial, createRange, createPrefill]);

  if (!open) return null;

  const editorFillPreview =
    normalizeHexColor(draft.colorHex) ??
    effectiveKindColor(draft.type, undefined);

  const commonDestinationLocked = mode === "edit" && initial?.type === "common";
  const commonDestinationDisplay: CommonCreateDestination =
    commonDestinationLocked && initial && initial.type === "common"
      ? calendarCommonEventUsesGoogleCalendar(initial)
        ? "google"
        : "internal"
      : commonCreateDestination;

  const showCommonDestination =
    draft.type === "common" &&
    (commonDestinationLocked ||
      (mode === "create" && !!googleCalendarConnected));

  const handleSave = () => {
    const next = editorDraftToScheduledEvent(draft, initial?.id, initial);
    if (!next) {
      if (draft.type === "task") {
        toast.error(
          "Pick a board and a task, or create one with quick-create.",
        );
      }
      return;
    }
    onSave(next, {
      saveToGoogle:
        mode === "create" &&
        commonCreateDestination === "google" &&
        next.type === "common" &&
        !!googleCalendarConnected,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!initial || !onDeleteRequest) return;
    onDeleteRequest(initial);
    onClose();
  };

  const inputClass =
    "w-full rounded-lg border border-white/15 bg-input-bg px-3 py-2 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]";

  return (
    <Dialog
      title={mode === "create" ? "Create event" : "Edit event"}
      subtitle="Time blocks, general events, and tasks stay on calendar."
      onClose={onClose}
      maxWidth={520}
      headerBeforeClose={
        mode === "edit" && onDeleteRequest ? (
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
      <EditorForm
        draft={draft}
        setDraft={setDraft}
        isGuest={isGuest}
        editorFillPreview={editorFillPreview}
        showCommonDestination={showCommonDestination}
        commonDestinationLocked={commonDestinationLocked}
        commonDestinationDisplay={commonDestinationDisplay}
        setCommonCreateDestination={setCommonCreateDestination}
        inputClass={inputClass}
        onCancel={onClose}
        onSave={handleSave}
      />

      {showDeleteConfirm && initial && onDeleteRequest ? (
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
