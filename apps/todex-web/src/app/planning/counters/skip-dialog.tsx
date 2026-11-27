"use client";

import { useState, type FormEvent } from "react";
import { Button, Dialog, DialogActions, Label, Textarea } from "@repo/ui";
import { COUNTER_SKIP_REASON_MAX_LENGTH } from "@repo/api/todex";

import { formatLocalDate } from "./counter-helpers";

export function SkipDialog({
  counterName,
  date,
  isPending,
  onSkip,
  onClose,
}: SkipDialogProps) {
  const [reason, setReason] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) return;
    onSkip(reason.trim());
  }

  return (
    <Dialog
      title={`Skip ${counterName}`}
      subtitle={formatLocalDate(date)}
      onClose={onClose}
      // The dialog focuses its first control, which should be the reason.
      showCloseButton={false}
    >
      <form className="space-y-2" onSubmit={submit}>
        <Label htmlFor="counter-skip-reason">Skip reason</Label>
        <Textarea
          id="counter-skip-reason"
          autoFocus
          required
          maxLength={COUNTER_SKIP_REASON_MAX_LENGTH}
          placeholder="Why are you skipping it?"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <DialogActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !reason.trim()}>
            Skip
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

interface SkipDialogProps {
  counterName: string;
  date: string;
  isPending: boolean;
  onSkip: (reason: string) => void;
  onClose: () => void;
}
