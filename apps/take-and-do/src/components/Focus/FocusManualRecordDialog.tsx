"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { PrimaryButton } from "@/components/Buttons";
import {
  ConfirmActions,
  ConfirmCancelBtn,
  Dialog,
  DialogFormGroup,
  DialogFormLabel,
} from "@/components/Dialogs";
import { Input } from "@/components/Input";
import { useFocusSessionContext } from "@/contexts/FocusSessionContext";
import { parseManualDurationInput } from "@/helpers/focus/focus-session.helper";

export function FocusManualRecordDialog({
  open,
  onClose,
}: FocusManualRecordDialogProps) {
  const { addManualFocusRecord } = useFocusSessionContext();
  const [name, setName] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [startedAtValue, setStartedAtValue] = useState(() =>
    formatDatetimeLocalValue(new Date()),
  );

  const resetForm = useCallback(() => {
    setName("");
    setDurationValue("");
    setStartedAtValue(formatDatetimeLocalValue(new Date()));
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSave = useCallback(() => {
    const durationMinutes = parseManualDurationInput(durationValue);
    if (durationMinutes === null) {
      toast.error("Duration must be between 1 minute and 24 hours");
      return;
    }

    const startedAt = parseDatetimeLocalValue(startedAtValue);
    if (!startedAt) {
      toast.error("Date and time are invalid");
      return;
    }

    const result = addManualFocusRecord({
      name,
      durationSeconds: durationMinutes * 60,
      startedAt: startedAt.toISOString(),
    });

    if (result.status !== "SUCCESS") {
      toast.error(result.reason ?? "Cannot save focus record");
      return;
    }

    toast.success("Focus record saved");
    handleClose();
  }, [addManualFocusRecord, durationValue, handleClose, name, startedAtValue]);

  if (!open) return null;

  return (
    <Dialog title="Add focus record" onClose={handleClose} maxWidth={440}>
      <div className="flex flex-col gap-4">
        <DialogFormGroup className="mb-0 gap-1.5">
          <DialogFormLabel htmlFor="manual-focus-name">Name</DialogFormLabel>
          <Input
            id="manual-focus-name"
            value={name}
            placeholder="Deep work"
            onChange={(event) => setName(event.target.value)}
          />
        </DialogFormGroup>

        <DialogFormGroup className="mb-0 gap-1.5">
          <DialogFormLabel htmlFor="manual-focus-duration">
            Duration
          </DialogFormLabel>
          <Input
            id="manual-focus-duration"
            value={durationValue}
            placeholder="45m"
            onChange={(event) => setDurationValue(event.target.value)}
          />
        </DialogFormGroup>

        <DialogFormGroup className="mb-0 gap-1.5">
          <DialogFormLabel htmlFor="manual-focus-started-at">
            Date & time
          </DialogFormLabel>
          <Input
            id="manual-focus-started-at"
            type="datetime-local"
            value={startedAtValue}
            onChange={(event) => setStartedAtValue(event.target.value)}
          />
        </DialogFormGroup>
      </div>

      <ConfirmActions>
        <ConfirmCancelBtn type="button" onClick={handleClose}>
          Cancel
        </ConfirmCancelBtn>
        <PrimaryButton type="button" size="sm" onClick={handleSave}>
          Save
        </PrimaryButton>
      </ConfirmActions>
    </Dialog>
  );
}

function formatDatetimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function parseDatetimeLocalValue(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

interface FocusManualRecordDialogProps {
  open: boolean;
  onClose: () => void;
}
