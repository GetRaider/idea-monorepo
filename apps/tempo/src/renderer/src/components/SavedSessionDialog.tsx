import { FormEvent, useState } from "react";

import {
  clampSessionName,
  SESSION_NAME_MAX_LENGTH,
  validateSavedSessionName,
} from "../../../helpers/session.helper";

import { ColorPicker } from "./ColorPicker";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";

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
        error instanceof Error ? error.message : "Could not save activity",
      );
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent overlayDismiss={false}>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <DialogTitle>Edit activity</DialogTitle>
          <label className="flex flex-col gap-1 text-sm text-tempo-muted">
            Name
            <input
              className="rounded-[10px] border border-tempo-line bg-transparent px-2.5 py-1.5 text-tempo-text"
              value={name}
              maxLength={SESSION_NAME_MAX_LENGTH}
              onChange={(event) => setName(clampSessionName(event.target.value))}
              autoFocus
            />
          </label>
          <ColorPicker value={color} onChange={setColor} />
          {errorMessage ? (
            <p className="m-0 text-sm text-tempo-danger">{errorMessage}</p>
          ) : null}
          <div className="mt-1 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface SavedSessionDialogProps {
  session: SavedSession;
  onClose: () => void;
  onSave: (input: UpdateSavedSessionInput) => Promise<void>;
}
