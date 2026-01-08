"use client";

import { useState } from "react";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  CloseButton,
  TextArea,
  ButtonGroup,
  CancelButton,
  CreateButton,
  LoadingOverlay,
  LoadingText,
} from "./AIComposeModal.styles";

interface AIComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompose: (text: string) => Promise<void>;
}

export function AIComposeModal({
  isOpen,
  onClose,
  onCompose,
}: AIComposeModalProps) {
  const [text, setText] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!text.trim() || isComposing) return;

    setIsComposing(true);
    try {
      await onCompose(text.trim());
      setText("");
      onClose();
    } catch (error) {
      console.error("Failed to compose task:", error);
    } finally {
      setIsComposing(false);
    }
  };

  const handleClose = () => {
    if (isComposing) return;
    setText("");
    onClose();
  };

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        {isComposing && (
          <LoadingOverlay>
            <LoadingText>⚡ Composing task...</LoadingText>
          </LoadingOverlay>
        )}
        <ModalHeader>
          <ModalTitle>⚡ Compose Task with AI</ModalTitle>
          <CloseButton onClick={handleClose} disabled={isComposing}>
            ×
          </CloseButton>
        </ModalHeader>
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your task in natural language...&#10;&#10;Example:&#10;Buy groceries for New Year celebration, high priority, due tomorrow, estimate 2 hours"
          disabled={isComposing}
          autoFocus
        />
        <ButtonGroup>
          <CancelButton onClick={handleClose} disabled={isComposing}>
            Cancel
          </CancelButton>
          <CreateButton
            onClick={handleCreate}
            disabled={!text.trim() || isComposing}
          >
            {isComposing ? "Composing..." : "Create"}
          </CreateButton>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
}

