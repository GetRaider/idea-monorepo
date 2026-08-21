import { FormEvent, useState } from "react";

import { validateSavedSessionName } from "../../../helpers/session.helper";
import {
  Button,
  ButtonRow,
  ErrorText,
  Field,
  FieldLabel,
  RequiredMark,
  TextInput,
} from "../App.styles";

import { ColorPicker } from "./ColorPicker";
import { DialogCard, DialogTitle, Overlay } from "./ManualRecordDialog.styles";

import type {
  SavedSession,
  UpdateSavedSessionInput,
} from "../../../shared/records.types";

export function SavedSessionDialog({
  session,
  onClose,
  onSave,
}: SavedSessionDialogProps) {
  const [name, setName] = useState(session.name);
  const [color, setColor] = useState(session.color);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      validateSavedSessionName(name);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Name is required",
      );
      return;
    }

    try {
      await onSave({ id: session.id, name, color });
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save session",
      );
    }
  }

  return (
    <Overlay>
      <DialogCard onSubmit={handleSubmit}>
        <DialogTitle>Edit regular session</DialogTitle>
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
        <ColorPicker value={color} onChange={setColor} />
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

interface SavedSessionDialogProps {
  session: SavedSession;
  onClose: () => void;
  onSave: (input: UpdateSavedSessionInput) => Promise<void>;
}
