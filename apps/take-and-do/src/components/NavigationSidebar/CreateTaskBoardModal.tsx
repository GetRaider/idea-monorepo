"use client";

import { Button } from "@radix-ui/themes";
import { useState } from "react";
import {
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  ModalTitle,
  CloseButton,
  FormGroup,
  Label,
  Input,
  ButtonGroup,
} from "./CreateTaskBoardModal.styles";

export default function CreateTaskBoardModal({
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Create Task Board</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

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
            />
          </FormGroup>

          <ButtonGroup>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isCreating}>
              {isCreating ? "Creating..." : "Save"}
            </Button>
          </ButtonGroup>
        </form>
      </ModalContainer>
    </ModalOverlay>
  );
}

interface CreateTaskBoardModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}
