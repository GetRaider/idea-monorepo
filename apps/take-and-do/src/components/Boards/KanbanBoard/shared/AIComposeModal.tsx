"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CloseIcon } from "@/components/Icons";
import { SecondaryButton, CloseButton } from "@/components/Buttons";
import {
  TextArea,
  ButtonGroup,
  CreateButton,
  DialogBodyFixed,
  ProgressState,
  ProgressBarWrapper,
  ProgressSegment,
  ProgressLabel,
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

const COMPOSE_STEPS = 4;
const STEP_INTERVAL_MS = 800;
const STEP_LABELS = [
  "Analyzing your request...",
  "Structuring the task...",
  "Adding details...",
  "Almost there...",
];

export function AIComposeModal({
  isOpen,
  onClose,
  onCompose,
}: AIComposeModalProps) {
  const [text, setText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isComposing) {
      setProgressStep(0);
      return;
    }
    intervalRef.current = setInterval(() => {
      setProgressStep((s) => (s < COMPOSE_STEPS - 1 ? s + 1 : s));
    }, STEP_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isComposing]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!text.trim() || isComposing) return;

    setIsComposing(true);
    try {
      await onCompose(text.trim());
      setProgressStep(COMPOSE_STEPS - 1);
      setText("");
      setTimeout(() => onClose(), 200);
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
        <DialogHeader>
          <DialogTitle>⚡ Compose Task with AI</DialogTitle>
          <CloseButton onClick={handleClose} disabled={isComposing}>
            <CloseIcon />
          </CloseButton>
        </DialogHeader>
        <DialogBodyFixed>
          {isComposing ? (
            <ProgressState>
              <ProgressBarWrapper>
                {Array.from({ length: COMPOSE_STEPS }).map((_, i) => (
                  <ProgressSegment
                    key={i}
                    $filled={i <= progressStep}
                    $active={i === progressStep}
                  />
                ))}
              </ProgressBarWrapper>
              <ProgressLabel>
                {STEP_LABELS[Math.min(progressStep, STEP_LABELS.length - 1)]}
              </ProgressLabel>
            </ProgressState>
          ) : (
            <>
              <TextArea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe your task in natural language...&#10;&#10;Example:&#10;Buy groceries for New Year celebration, high priority, due tomorrow, estimate 2 hours"
                autoFocus
              />
              <CharCounter $nearLimit={text.length > 600}>
                {text.length} / {700}
              </CharCounter>
              <ButtonGroup>
                <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                <CreateButton
                  onClick={handleCreate}
                  disabled={!text.trim()}
                >
                  Compose
                </CreateButton>
              </ButtonGroup>
            </>
          )}
        </DialogBodyFixed>
      </DialogContainer>
    </DialogOverlay>
  );
}
