"use client";

import {
  ConfirmCancelBtn,
  Dialog,
  DialogActions,
  DialogBody,
} from "@/components/Dialogs";
import { cn } from "@/lib/styles/utils";
import type { GoogleCalendarRecurrenceScope } from "@/types/calendar.types";

interface GoogleCalendarRecurrenceScopeDialogProps {
  open: boolean;
  intent?: "edit" | "delete";
  /** When true, "This and following" is unavailable (no recurrence metadata). */
  followingOptionDisabled?: boolean;
  onClose: () => void;
  onChoose: (scope: GoogleCalendarRecurrenceScope) => void;
}

export function GoogleCalendarRecurrenceScopeDialog({
  open,
  intent = "edit",
  followingOptionDisabled = false,
  onClose,
  onChoose,
}: GoogleCalendarRecurrenceScopeDialogProps) {
  if (!open) return null;

  const isDelete = intent === "delete";

  return (
    <Dialog
      title={isDelete ? "Delete recurring event" : "Recurring Google event"}
      subtitle={
        isDelete
          ? "Choose how much of this Google Calendar series to remove."
          : "This event is part of a repeating Google Calendar series."
      }
      onClose={onClose}
      showCloseButton
      maxWidth={440}
      overlayClassName="z-[5200]"
    >
      <DialogBody>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-600 bg-zinc-900/80 px-4 py-3 text-left text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
            onClick={() => onChoose("instance")}
          >
            This event only
            <span className="mt-0.5 block text-xs font-normal text-zinc-400">
              {isDelete
                ? "Remove only this occurrence."
                : "Change just this occurrence (exception)."}
            </span>
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-600 bg-zinc-900/80 px-4 py-3 text-left text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
            onClick={() => onChoose("series")}
          >
            All events
            <span className="mt-0.5 block text-xs font-normal text-zinc-400">
              {isDelete
                ? "Delete the entire repeating series."
                : "Update the entire series (same rule for every occurrence)."}
            </span>
          </button>
          <button
            type="button"
            disabled={followingOptionDisabled}
            className={cn(
              "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
              followingOptionDisabled
                ? "cursor-not-allowed border-zinc-800 bg-zinc-950/50 text-zinc-500"
                : "border-zinc-600 bg-zinc-900/80 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800",
            )}
            onClick={() => {
              if (followingOptionDisabled) return;
              onChoose("following");
            }}
          >
            This and following events
            <span className="mt-0.5 block text-xs font-normal text-zinc-400">
              {isDelete
                ? "Remove this occurrence and all future ones (past events stay)."
                : "Split the series: keep past occurrences, new rule forward."}
            </span>
          </button>
        </div>
      </DialogBody>
      <DialogActions>
        <ConfirmCancelBtn type="button" onClick={onClose}>
          Cancel
        </ConfirmCancelBtn>
      </DialogActions>
    </Dialog>
  );
}
