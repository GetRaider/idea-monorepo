import { FormEvent, useState } from "react";

import { parseMinutesInput } from "../../../helpers/session.helper";
import {
  Button,
  ButtonRow,
  ErrorText,
  Field,
  FieldLabel,
  RequiredMark,
  TextInput,
} from "../App.styles";

import { DialogCard, DialogTitle, Overlay } from "./ManualRecordDialog.styles";

import type {
  AddManualRecordInput,
  FocusRecord,
  UpdateRecordInput,
} from "../../../shared/records.types";

export function ManualRecordDialog({
  record,
  onClose,
  onCreate,
  onUpdate,
}: ManualRecordDialogProps) {
  const isEditing = record !== null;
  const [name, setName] = useState(record?.name ?? "");
  const [durationInput, setDurationInput] = useState(
    record === null
      ? "25"
      : String(Math.max(1, Math.round(record.accumulatedSeconds / 60))),
  );
  const [startedAtLocal, setStartedAtLocal] = useState(
    toDatetimeLocalValue(
      record === null ? new Date() : new Date(record.startedAt),
    ),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length === 0) {
      setErrorMessage("Name is required");
      return;
    }

    const durationMinutes = parseMinutesInput(durationInput);
    if (durationMinutes === null) {
      setErrorMessage("Duration is required");
      return;
    }

    const startedAt = new Date(startedAtLocal);
    if (Number.isNaN(startedAt.getTime())) {
      setErrorMessage("Date and time is invalid");
      return;
    }

    try {
      if (record === null) {
        await onCreate({
          name,
          durationSeconds: durationMinutes * 60,
          startedAt: startedAt.toISOString(),
          kind: "unknown",
          sessionId: null,
          saveToBacklog: false,
        });
      } else {
        await onUpdate({
          id: record.id,
          name,
          durationSeconds: durationMinutes * 60,
          startedAt: startedAt.toISOString(),
        });
      }
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save record",
      );
    }
  }

  return (
    <Overlay>
      <DialogCard onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? "Edit focus record" : "Add focus record"}
        </DialogTitle>
        <Field>
          <FieldLabel>
            Name
            <RequiredMark>*</RequiredMark>
          </FieldLabel>
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </Field>
        <Field>
          <FieldLabel>
            Duration
            <RequiredMark>*</RequiredMark>
          </FieldLabel>
          <TextInput
            value={durationInput}
            onChange={(event) => setDurationInput(event.target.value)}
            placeholder="45m"
          />
        </Field>
        <Field>
          <FieldLabel>Date & time</FieldLabel>
          <TextInput
            type="datetime-local"
            value={startedAtLocal}
            onChange={(event) => setStartedAtLocal(event.target.value)}
          />
        </Field>
        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}
        <ButtonRow>
          <Button type="button" $variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </ButtonRow>
      </DialogCard>
    </Overlay>
  );
}

function toDatetimeLocalValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

interface ManualRecordDialogProps {
  record: FocusRecord | null;
  onClose: () => void;
  onCreate: (input: AddManualRecordInput) => Promise<void>;
  onUpdate: (input: UpdateRecordInput) => Promise<void>;
}
