"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CloseIcon } from "@/components/Icons";
import { SecondaryButton, CloseButton } from "@/components/Buttons";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  TextArea,
  ButtonGroup,
  CreateButton,
  LoadingOverlay,
  LoadingText,
} from "./AIComposeModal.styles";
import { CharCounter } from "@/components/Labels/CharCounter.styles";
import {
  DialogContainer,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/Dialogs/Dialog.styles";

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
      toast.error("Failed to compose task with AI");
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
    <DialogOverlay onClick={handleClose}>
      <DialogContainer $maxWidth={720} onClick={(e) => e.stopPropagation()}>
        {isComposing && (
          <LoadingOverlay>
            <LoadingText>⚡ Composing task...</LoadingText>
          </LoadingOverlay>
        )}
        <DialogHeader>
          <DialogTitle>⚡ Compose Task with AI</DialogTitle>
          <CloseButton onClick={handleClose} disabled={isComposing}>
            <CloseIcon />
          </CloseButton>
        </DialogHeader>
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your task in natural language...&#10;&#10;Example:&#10;Buy groceries for New Year celebration, high priority, due tomorrow, estimate 2 hours"
          disabled={isComposing}
          autoFocus
        />
        <CharCounter $nearLimit={text.length > 600}>
          {text.length} / {700}
        </CharCounter>
        <ButtonGroup>
          <SecondaryButton onClick={handleClose} disabled={isComposing}>
            Cancel
          </SecondaryButton>
          <CreateButton
            onClick={handleCreate}
            disabled={!text.trim() || isComposing}
          >
            {isComposing ? "Composing..." : "Compose"}
          </CreateButton>
        </ButtonGroup>
      </DialogContainer>
    </DialogOverlay>
  );
}
