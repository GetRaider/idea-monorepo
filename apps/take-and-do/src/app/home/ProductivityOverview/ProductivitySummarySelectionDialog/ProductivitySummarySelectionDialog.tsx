"use client";

import { CloseIcon } from "@/components/Icons";
import { SecondaryButton, CloseButton } from "@/components/Buttons";
import { DialogHeading, DialogScrim } from "@/components/Dialogs";
import {
  DialogContent,
  DialogHeader,
  HeaderContent,
  OptionsContainer,
  OptionBlock,
  OptionTitle,
  OptionDescription,
  ActionsContainer,
  SaveButton,
  DialogDescription,
} from "./ProductivitySummarySelectionDialog.ui";

interface ProductivitySummarySelectionDialogProps {
  onClose: () => void;
  onSelect: (useAI: boolean) => void;
  selectedOption: "basic" | "ai" | null;
  onSave: () => void;
  isGenerating: boolean;
}

export function ProductivitySummarySelectionDialog({
  onClose,
  onSelect,
  selectedOption,
  onSave,
  isGenerating,
}: ProductivitySummarySelectionDialogProps) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <DialogScrim onClick={handleOverlayClick}>
      <DialogContent>
        <DialogHeader>
          <HeaderContent>
            <DialogHeading>⚡ Productivity Summary</DialogHeading>
            <DialogDescription>
              Explore your productivity by generating an AI personalized or
              basic summary, calculated based on your task statistics and
              completion rates.
            </DialogDescription>
          </HeaderContent>
          <CloseButton onClick={onClose}>
            <CloseIcon />
          </CloseButton>
        </DialogHeader>

        <OptionsContainer>
          <OptionBlock
            isSelected={selectedOption === "ai"}
            isAi={true}
            onClick={() => onSelect(true)}
          >
            <OptionTitle>AI Summary</OptionTitle>
            <OptionDescription>
              A personalized AI-powered analytics with insights, risks, and
              recommendations.
            </OptionDescription>
          </OptionBlock>

          <OptionBlock
            isSelected={selectedOption === "basic"}
            onClick={() => onSelect(false)}
          >
            <OptionTitle>Basic Summary</OptionTitle>
            <OptionDescription>
              A manually calculated analytics based on your task statistics and
              completion rates.
            </OptionDescription>
          </OptionBlock>
        </OptionsContainer>

        <ActionsContainer>
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <SaveButton
            onClick={onSave}
            disabled={isGenerating || selectedOption === null}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </SaveButton>
        </ActionsContainer>
      </DialogContent>
    </DialogScrim>
  );
}
