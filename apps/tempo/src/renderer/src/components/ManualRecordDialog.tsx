import { FormEvent, useMemo, useState } from "react";

import { buildManualSessionOptions } from "../../../helpers/history.helper";
import { parseMinutesInput } from "../../../helpers/session.helper";
import {
  Button,
  ButtonRow,
  CheckboxField,
  ErrorText,
  Field,
  FieldLabel,
  RequiredMark,
  TextArea,
  TextInput,
} from "../App.styles";

import {
  DialogCard,
  DialogTitle,
  Overlay,
  SessionSelect,
} from "./ManualRecordDialog.styles";

import type {
  AddManualRecordInput,
  FocusRecord,
  SavedSession,
  UpdateRecordInput,
} from "../../../shared/records.types";

export function ManualRecordDialog({
  record,
  sessions,
  defaultSaveNewSessions,
  onClose,
  onCreate,
  onUpdate,
}: ManualRecordDialogProps) {
  const isEditing = record !== null;
  const sessionOptions = useMemo(
    () => buildManualSessionOptions(sessions),
    [sessions],
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(() =>
    getInitialSessionId(record),
  );
  const [name, setName] = useState(record?.name ?? "");
  const [scope, setScope] = useState(record?.scope ?? "");
  const [saveToBacklog, setSaveToBacklog] = useState(
    record === null ? defaultSaveNewSessions : false,
  );
  const [durationInput, setDurationInput] = useState(
    record === null
      ? "25"
      : String(Math.max(1, Math.floor(record.accumulatedSeconds / 60))),
  );
  const [startedAtLocal, setStartedAtLocal] = useState(
    toDatetimeLocalValue(
      record === null ? new Date() : new Date(record.startedAt),
    ),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedSession = sessions.find(
    (session) => session.id === selectedSessionId,
  );
  const isBacklogSelected = selectedSession !== undefined;
  const showSessionPicker = sessions.length > 0;

  function handleSessionChange(sessionId: string) {
    if (sessionId === "") {
      setSelectedSessionId(null);
      return;
    }

    setSelectedSessionId(sessionId);
    setSaveToBacklog(false);
    const session = sessions.find((item) => item.id === sessionId);
    if (session) {
      setName(session.name);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isBacklogSelected && name.trim().length === 0) {
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
          name: isBacklogSelected ? selectedSession.name : name,
          scope,
          durationSeconds: durationMinutes * 60,
          startedAt: startedAt.toISOString(),
          kind: isBacklogSelected ? "backlog" : "unknown",
          sessionId: selectedSessionId,
          saveToBacklog: !isBacklogSelected && saveToBacklog,
        });
      } else {
        await onUpdate({
          id: record.id,
          name: isBacklogSelected ? selectedSession.name : name,
          scope,
          durationSeconds: durationMinutes * 60,
          startedAt: startedAt.toISOString(),
          kind: isBacklogSelected ? "backlog" : "unknown",
          sessionId: selectedSessionId,
          saveToBacklog: !isBacklogSelected && saveToBacklog,
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
        {showSessionPicker ? (
          <Field>
            <FieldLabel>Regular Session</FieldLabel>
            <SessionSelect
              value={selectedSessionId ?? ""}
              onChange={(event) => handleSessionChange(event.target.value)}
            >
              {sessionOptions.map((option) => (
                <option key={option.value || "custom"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SessionSelect>
          </Field>
        ) : null}
        <Field>
          <FieldLabel>
            Name
            <RequiredMark>*</RequiredMark>
          </FieldLabel>
          <TextInput
            value={name}
            disabled={isBacklogSelected}
            onChange={(event) => setName(event.target.value)}
            autoFocus={!showSessionPicker}
          />
        </Field>
        <Field>
          <FieldLabel>Scope</FieldLabel>
          <TextArea
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            placeholder="What was done in this session"
            rows={2}
          />
        </Field>
        {!isBacklogSelected ? (
          <CheckboxField>
            <input
              type="checkbox"
              checked={saveToBacklog}
              onChange={(event) => setSaveToBacklog(event.target.checked)}
            />
            Save as Regular
          </CheckboxField>
        ) : null}
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

function getInitialSessionId(record: FocusRecord | null): string | null {
  if (record?.kind === "backlog" && record.sessionId !== null) {
    return record.sessionId;
  }

  return null;
}

function toDatetimeLocalValue(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

interface ManualRecordDialogProps {
  record: FocusRecord | null;
  sessions: SavedSession[];
  defaultSaveNewSessions: boolean;
  onClose: () => void;
  onCreate: (input: AddManualRecordInput) => Promise<void>;
  onUpdate: (input: UpdateRecordInput) => Promise<void>;
}
