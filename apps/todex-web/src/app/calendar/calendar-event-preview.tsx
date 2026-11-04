"use client";

import { useState, type ReactNode } from "react";
import { Button, Input } from "@repo/ui";
import type { CalendarRsvpStatus } from "@repo/api/todex";

import { CloseIcon } from "@components/icons";
import {
  combineLocalDateAndTime,
  isoToDateInput,
  isoToLocalTimeInput,
} from "../planning/task-helpers";

import type { CalendarBlock } from "./calendar-blocks";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

export function CalendarEventPreview({
  preview,
  onClose,
  onMore,
  onSave,
  onRsvp,
}: {
  preview: EventPreview;
  onClose: () => void;
  onMore: () => void;
  onSave: (body: { title: string; start: string; end: string; allDay: boolean }) => Promise<void>;
  onRsvp: (status: CalendarRsvpStatus) => void;
}) {
  const block = preview.block;
  const [title, setTitle] = useState(block.title);
  const [start, setStart] = useState(block.start.toISOString());
  const [end, setEnd] = useState(block.end.toISOString());
  const [pending, setPending] = useState(false);
  const minutes = Math.max(15, Math.round((Date.parse(end) - Date.parse(start)) / 60_000));
  const durationChoices = DURATION_OPTIONS.some((option) => option === minutes)
    ? DURATION_OPTIONS
    : [minutes, ...DURATION_OPTIONS].sort((left, right) => left - right);
  const canSave = title.trim().length > 0 && Date.parse(start) < Date.parse(end);

  function applyRange(dateValue: string, timeValue: string, durationMinutes: number) {
    const iso = combineLocalDateAndTime(dateValue, timeValue || "00:00");
    if (!iso) return;
    const nextStart = new Date(iso);
    setStart(nextStart.toISOString());
    setEnd(new Date(nextStart.getTime() + durationMinutes * 60_000).toISOString());
  }

  return (
    <form
      className="calendar-event-preview absolute z-30 flex w-[22rem] max-w-[calc(100%-1rem)] flex-col gap-3 overflow-y-auto rounded-xl border border-border bg-popover p-3 shadow-lg"
      style={{ left: preview.left, top: preview.top, maxHeight: preview.maxHeight }}
      onMouseDown={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave || pending || block.readOnly) return;
        setPending(true);
        void onSave({
          title: title.trim(),
          start,
          end,
          allDay: block.allDay,
        }).finally(() => setPending(false));
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Event</span>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label="Close"
          onClick={onClose}
        >
          <CloseIcon size={14} />
        </button>
      </div>
      <Input
        value={title}
        aria-label="Event title"
        disabled={block.readOnly}
        onChange={(event) => setTitle(event.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Date">
          <input
            type="date"
            aria-label="Date"
            disabled={block.readOnly}
            value={isoToDateInput(start)}
            className="h-9 w-full rounded-md border border-border bg-transparent px-2 text-sm disabled:opacity-40"
            onChange={(event) =>
              applyRange(event.target.value, isoToLocalTimeInput(start), minutes)
            }
          />
        </Field>
        <Field label="Start">
          <input
            type="time"
            aria-label="Start"
            disabled={block.readOnly || block.allDay}
            value={isoToLocalTimeInput(start)}
            className="h-9 w-full rounded-md border border-border bg-transparent px-2 text-sm disabled:opacity-40"
            onChange={(event) =>
              applyRange(isoToDateInput(start), event.target.value, minutes)
            }
          />
        </Field>
        <Field label="Duration">
          <select
            aria-label="Duration"
            disabled={block.readOnly || block.allDay}
            value={minutes}
            className="h-9 w-full rounded-md border border-border bg-transparent px-2 text-sm disabled:opacity-40"
            onChange={(event) =>
              applyRange(
                isoToDateInput(start),
                isoToLocalTimeInput(start),
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
          <select aria-label="Type" value="event" disabled className="h-9 w-full rounded-md border border-border bg-transparent px-2 text-sm">
            <option value="event">Event</option>
          </select>
        </Field>
      </div>
      <div className="flex gap-1">
        {RSVP.map((option) => (
          <button
            key={option.status}
            type="button"
            className={
              block.rsvpStatus === option.status
                ? "flex-1 rounded-md bg-accent px-2 py-1 text-xs font-medium"
                : "flex-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
            }
            onClick={() => onRsvp(option.status)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button type="button" className="text-sm text-primary" onClick={onMore}>
          More options
        </button>
        <Button type="submit" size="sm" variant="solid" disabled={!canSave || pending || block.readOnly}>
          Save
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

const RSVP: { status: CalendarRsvpStatus; label: string }[] = [
  { status: "yes", label: "Yes" },
  { status: "no", label: "No" },
  { status: "maybe", label: "Maybe" },
];

export interface EventPreview {
  block: CalendarBlock;
  left: number;
  top: number;
  maxHeight: number;
}
