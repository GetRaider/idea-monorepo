"use client";

import { useEffect, useState } from "react";

import {
  ConfirmDangerBtn,
  ConfirmDialog,
  Dialog,
  DialogActions,
  DialogBody,
  DialogFormButton,
  DialogFormGroup,
  DialogFormLabel,
} from "@/components/Dialogs";
import { Dropdown } from "@/components/Dropdown";
import { Input } from "@/components/Input";
import type {
  CalendarBacklogEvent,
  CalendarBacklogType,
} from "@/types/calendar.types";

import { CalendarEventTaskScopeSection } from "./CalendarEventTaskScopeSection";
import { kindLabel } from "./calendar-event-mapper";

interface CalendarTemplateEditorDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initial: CalendarBacklogEvent | null;
  onClose: () => void;
  onSave: (item: CalendarBacklogEvent) => void;
  onDelete?: (id: string) => void;
}

interface Draft {
  title: string;
  type: CalendarBacklogType;
  minutes: number;
  taskScope: string[];
  descriptionText: string;
}

function emptyDraft(): Draft {
  return {
    title: "",
    type: "timeBlock",
    minutes: 60,
    taskScope: [],
    descriptionText: "",
  };
}

function fromItem(item: CalendarBacklogEvent): Draft {
  return {
    title: item.title,
    type: item.type,
    minutes: item.durationMinutes,
    taskScope: item.taskScope ?? [],
    descriptionText: item.description ?? "",
  };
}

function toItem(draft: Draft, id: string): CalendarBacklogEvent | null {
  const title = draft.title.trim();
  if (!title || draft.minutes <= 0) return null;
  const taskScopeLines = draft.taskScope.map((t) => t.trim()).filter(Boolean);
  return {
    id,
    type: draft.type,
    title,
    durationMinutes: draft.minutes,
    ...(draft.descriptionText.trim()
      ? { description: draft.descriptionText.trim() }
      : {}),
    ...(taskScopeLines.length ? { taskScope: taskScopeLines } : {}),
  };
}

export function CalendarTemplateEditorDialog({
  open,
  mode,
  initial,
  onClose,
  onSave,
  onDelete,
}: CalendarTemplateEditorDialogProps) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) setDraft(fromItem(initial));
    else setDraft(emptyDraft());
  }, [open, initial]);

  if (!open) return null;

  const handleSave = () => {
    const id = initial?.id ?? crypto.randomUUID();
    const item = toItem(draft, id);
    if (!item) return;
    onSave(item);
    onClose();
  };

  const handleDelete = () => {
    if (!initial || !onDelete) return;
    onDelete(initial.id);
    onClose();
  };

  return (
    <Dialog
      title={mode === "create" ? "Create backlog event" : "Edit backlog event"}
      subtitle="Reusable events you can drag onto the calendar to schedule."
      onClose={onClose}
      maxWidth={480}
    >
      <DialogBody className="gap-4">
        <DialogFormGroup>
          <DialogFormLabel>Title</DialogFormLabel>
          <Input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="e.g. Deep work, Stand-up"
          />
        </DialogFormGroup>

        <DialogFormGroup>
          <DialogFormLabel>Type</DialogFormLabel>
          <Dropdown<CalendarBacklogType>
            options={[
              { value: "timeBlock", label: kindLabel("timeBlock") },
              { value: "common", label: kindLabel("common") },
            ]}
            value={draft.type}
            onChange={(type) => setDraft((d) => ({ ...d, type }))}
            fullWidth
          />
        </DialogFormGroup>

        <DialogFormGroup>
          <DialogFormLabel>Duration</DialogFormLabel>
          <Dropdown<string>
            options={[
              { value: "15", label: "15 min" },
              { value: "30", label: "30 min" },
              { value: "45", label: "45 min" },
              { value: "60", label: "1 hour" },
              { value: "90", label: "1h 30m" },
              { value: "120", label: "2 hours" },
              { value: "180", label: "3 hours" },
            ]}
            value={String(draft.minutes)}
            onChange={(v) =>
              setDraft((d) => ({ ...d, minutes: parseInt(v, 10) || 0 }))
            }
            fullWidth
          />
        </DialogFormGroup>

        <DialogFormGroup>
          <DialogFormLabel>Description</DialogFormLabel>
          <textarea
            className="w-full min-h-[80px] resize-y rounded-lg border border-white/15 bg-input-bg px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            value={draft.descriptionText}
            onChange={(e) =>
              setDraft((d) => ({ ...d, descriptionText: e.target.value }))
            }
            placeholder="Optional"
          />
        </DialogFormGroup>

        <CalendarEventTaskScopeSection
          value={draft.taskScope}
          onChange={(next) => setDraft((d) => ({ ...d, taskScope: next }))}
          disabled={draft.type !== "timeBlock"}
        />
      </DialogBody>

      <DialogActions className="flex flex-wrap justify-between gap-3">
        <div>
          {mode === "edit" && onDelete ? (
            <ConfirmDangerBtn
              type="button"
              onClick={() => setShowRemoveConfirm(true)}
            >
              Remove event
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

      {showRemoveConfirm && initial && onDelete ? (
        <ConfirmDialog
          title="Remove backlog event?"
          description="This will permanently delete this backlog event. This action cannot be undone."
          confirmLabel="Remove"
          onConfirm={handleDelete}
          onClose={() => setShowRemoveConfirm(false)}
          maxWidth={480}
        />
      ) : null}
    </Dialog>
  );
}
