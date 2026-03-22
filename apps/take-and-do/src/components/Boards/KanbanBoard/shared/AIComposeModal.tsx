"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CloseIcon } from "@/components/Icons";
import { SecondaryButton, CloseButton } from "@/components/Buttons";
import { CharCounter } from "@/components/Labels/CharCounter";
import {
  DialogContainer,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/Dialogs/Dialog";
import { StepProgressSegments } from "@/components/StepProgressSegments";

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
      setProgressStep((step) => (step < COMPOSE_STEPS - 1 ? step + 1 : step));
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
      <DialogContainer
        $maxWidth={720}
        onClick={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>⚡ Compose Task with AI</DialogTitle>
          <CloseButton onClick={handleClose} disabled={isComposing}>
            <CloseIcon />
          </CloseButton>
        </DialogHeader>
        <div className="min-h-[280px]">
          {isComposing ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center">
              <StepProgressSegments
                totalSteps={COMPOSE_STEPS}
                currentStep={progressStep}
              />
              <div className="text-sm font-medium text-[#a0a0a0] transition-opacity duration-200">
                {STEP_LABELS[Math.min(progressStep, STEP_LABELS.length - 1)]}
              </div>
            </div>
          ) : (
            <>
              <textarea
                value={text}
                maxLength={700}
                onChange={(event) => setText(event.target.value.slice(0, 700))}
                placeholder={
                  "Describe your task in natural language...\n\nExample:\nBuy groceries for New Year celebration, high priority, due tomorrow, estimate 2 hours"
                }
                autoFocus
                className="mb-5 min-h-[200px] w-full resize-y rounded-lg border border-input-border bg-input-bg p-3 font-inherit text-sm text-white outline-none transition-[border-color] placeholder:text-text-tertiary placeholder:whitespace-pre-line focus:border-accent-primary disabled:cursor-not-allowed disabled:opacity-60"
              />
              <CharCounter $nearLimit={text.length > 600}>
                {text.length} / {700}
              </CharCounter>
              <div className="flex justify-end gap-3">
                <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!text.trim()}
                  className="cursor-pointer rounded-lg border-0 bg-[#7255c1] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-[#5a42a1] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Compose
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContainer>
    </DialogOverlay>
  );
}
