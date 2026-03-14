"use client";

import { useState } from "react";
import { Dialog } from "@/components/Dialogs";
import {
  FormGroup,
  Label,
  Input,
  ButtonGroup,
  Button,
} from "./CreateTaskBoardModal.styles";

export function CreateTaskBoardModal({
  onClose,
  onCreate,
}: CreateTaskBoardModalProps) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isCreating) return;

    setIsCreating(true);
    try {
      await onCreate(name.trim());
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog title="Create Board" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="task-board-name">Name</Label>
          <Input
            id="task-board-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter task board name..."
            autoFocus
            required
            maxLength={32}
          />
        </FormGroup>

        <ButtonGroup>
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            $primary
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? "Creating..." : "Save"}
          </Button>
        </ButtonGroup>
      </form>
    </Dialog>
  );
}

interface CreateTaskBoardModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}
