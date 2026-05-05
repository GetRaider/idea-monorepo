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
import { Dropdown } from "@/components/Dropdown";
import { Input } from "@/components/Input";
import type {
  CalendarBacklogItem,
  CalendarBacklogKind,
} from "@/types/calendar.types";

import { CalendarEventTaskScopeSection } from "./CalendarEventTaskScopeSection";
import { kindLabel } from "./calendar-event-mapper";

interface CalendarTemplateEditorDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initial: CalendarBacklogItem | null;
  onClose: () => void;
  onSave: (item: CalendarBacklogItem) => void;
  onDelete?: (id: string) => void;
}

interface Draft {
  title: string;
  kind: CalendarBacklogKind;
  minutes: number;
  taskScope: string[];
  attendeesNote: string;
}

function emptyDraft(): Draft {
  return {
    title: "",
    kind: "time_block",
    minutes: 60,
    taskScope: [],
    attendeesNote: "",
  };
}

function fromItem(item: CalendarBacklogItem): Draft {
  return {
    title: item.title,
    kind: item.kind,
    minutes: item.defaultDurationMinutes,
    taskScope: item.taskScope ?? [],
    attendeesNote: item.attendeesNote ?? "",
  };
}

function toItem(draft: Draft, id: string): CalendarBacklogItem | null {
  const title = draft.title.trim();
  if (!title || draft.minutes <= 0) return null;
  const taskScopeLines = draft.taskScope.map((t) => t.trim()).filter(Boolean);
  return {
    id,
    kind: draft.kind,
    title,
    defaultDurationMinutes: draft.minutes,
    ...(taskScopeLines.length ? { taskScope: taskScopeLines } : {}),
    ...(draft.attendeesNote.trim()
      ? { attendeesNote: draft.attendeesNote.trim() }
      : {}),
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
      title={mode === "create" ? "New backlog template" : "Edit template"}
      subtitle="Reusable blocks you drag onto the calendar. Templates cannot be task-type — link tasks when scheduling on the calendar."
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
          <Dropdown<CalendarBacklogKind>
            options={[
              { value: "time_block", label: kindLabel("time_block") },
              { value: "general", label: kindLabel("general") },
            ]}
            value={draft.kind}
            onChange={(kind) => setDraft((d) => ({ ...d, kind }))}
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

        {draft.kind === "time_block" ? (
          <CalendarEventTaskScopeSection
            value={draft.taskScope}
            onChange={(next) => setDraft((d) => ({ ...d, taskScope: next }))}
          />
        ) : (
          <DialogFormGroup>
            <DialogFormLabel>People / notes</DialogFormLabel>
            <Input
              value={draft.attendeesNote}
              onChange={(e) =>
                setDraft((d) => ({ ...d, attendeesNote: e.target.value }))
              }
              placeholder="Who or what this template is for"
            />
          </DialogFormGroup>
        )}
      </DialogBody>

      <DialogActions className="flex flex-wrap justify-between gap-3">
        <div>
          {mode === "edit" && onDelete ? (
            <ConfirmDangerBtn type="button" onClick={handleDelete}>
              Remove template
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
