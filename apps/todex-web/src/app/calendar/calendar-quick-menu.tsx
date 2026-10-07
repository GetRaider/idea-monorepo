"use client";

import type { CalendarEvent, CalendarRsvpStatus } from "@repo/api/todex";

import type { CalendarBlock } from "./calendar-blocks";

export function CalendarQuickMenu({
  menu,
  event,
  onClose,
  onRsvp,
  onDelete,
  onDuplicate,
}: {
  menu: QuickMenuState;
  event: CalendarEvent | null;
  onClose: () => void;
  onRsvp: (status: CalendarRsvpStatus) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div
      className="calendar-quick-menu absolute z-40 w-40 rounded-xl border border-border bg-popover p-1 shadow-lg"
      style={{ left: menu.left, top: menu.top }}
      onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
    >
      <div className="grid grid-cols-3 gap-1 p-1">
        {RSVP.map((option) => (
          <button
            key={option.status}
            type="button"
            className={
              event?.rsvpStatus === option.status
                ? "rounded-md bg-accent px-1 py-1 text-[11px] font-medium"
                : "rounded-md px-1 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent"
            }
            onClick={() => {
              onRsvp(option.status);
              onClose();
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="flex w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
        disabled={!event}
        onClick={() => {
          onDuplicate();
          onClose();
        }}
      >
        Duplicate
      </button>
      <button
        type="button"
        className="flex w-full rounded-lg px-2 py-1.5 text-left text-sm text-destructive hover:bg-accent"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        Delete
      </button>
    </div>
  );
}

const RSVP: { status: CalendarRsvpStatus; label: string }[] = [
  { status: "yes", label: "Yes" },
  { status: "no", label: "No" },
  { status: "maybe", label: "Maybe" },
];

export interface QuickMenuState {
  block: CalendarBlock;
  left: number;
  top: number;
}
