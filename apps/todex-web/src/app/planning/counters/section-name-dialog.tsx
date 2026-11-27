"use client";

import { useState, type FormEvent } from "react";
import { Button, Dialog, DialogActions, Input, Label } from "@repo/ui";

/** Names a new section or renames one. */
export function SectionNameDialog({
  initialName,
  isPending,
  onSubmit,
  onClose,
}: {
  /** Absent for a new section. */
  initialName?: string;
  isPending: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName ?? "");
  const isNew = initialName === undefined;
  const trimmed = name.trim();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <Dialog
      title={isNew ? "New section" : "Rename section"}
      onClose={onClose}
      // The dialog focuses its first control, which should be the name.
      showCloseButton={false}
    >
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="counter-section-name">Name</Label>
          <Input
            id="counter-section-name"
            autoFocus
            maxLength={100}
            placeholder="Morning routine"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <DialogActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || !trimmed}>
            {isNew ? "Create" : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
