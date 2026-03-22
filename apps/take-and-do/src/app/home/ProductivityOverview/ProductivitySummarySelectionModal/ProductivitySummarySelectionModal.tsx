"use client";

import { CloseIcon } from "@/components/Icons";
import { SecondaryButton, CloseButton } from "@/components/Buttons";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  HeaderContent,
  ModalTitle,
  OptionsContainer,
  OptionBlock,
  OptionTitle,
  OptionDescription,
  ActionsContainer,
  SaveButton,
  ModalDescription,
} from "./ProductivitySummarySelectionModal.ui";

interface ProductivitySummarySelectionModalProps {
  onClose: () => void;
  onSelect: (useAI: boolean) => void;
  selectedOption: "basic" | "ai" | null;
  onSave: () => void;
  isGenerating: boolean;
}

export function ProductivitySummarySelectionModal({
  onClose,
  onSelect,
  selectedOption,
  onSave,
  isGenerating,
}: ProductivitySummarySelectionModalProps) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <HeaderContent>
            <ModalTitle>⚡ Productivity Summary</ModalTitle>
            <ModalDescription>
              Explore your productivity by generating an AI personalized or
              basic summary, calculated based on your task statistics and
              completion rates.
            </ModalDescription>
          </HeaderContent>
          <CloseButton onClick={onClose}>
            <CloseIcon />
          </CloseButton>
        </ModalHeader>

        <OptionsContainer>
          <OptionBlock
            $selected={selectedOption === "ai"}
            $isAI={true}
            onClick={() => onSelect(true)}
          >
            <OptionTitle>AI Summary</OptionTitle>
            <OptionDescription>
              A personalized AI-powered analytics with insights, risks, and
              recommendations.
            </OptionDescription>
          </OptionBlock>

          <OptionBlock
            $selected={selectedOption === "basic"}
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
      </ModalContent>
    </ModalOverlay>
  );
}
