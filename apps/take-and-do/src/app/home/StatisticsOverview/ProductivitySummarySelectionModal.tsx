"use client";

import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  HeaderContent,
  ModalTitle,
  CloseButton,
  OptionsContainer,
  OptionBlock,
  OptionTitle,
  OptionDescription,
  ActionsContainer,
  CancelButton,
  SaveButton,
  ModalDescription,
} from "./ProductivitySummarySelectionModal.styles";

interface ProductivitySummarySelectionModalProps {
  onClose: () => void;
  onSelect: (useAI: boolean) => void;
  selectedOption: "basic" | "ai" | null;
  onSave: () => void;
  isGenerating: boolean;
}

function ProductivitySummarySelectionModal({
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
            <ModalTitle>⚡ Explore Productivity</ModalTitle>
            <ModalDescription>
              Explore your productivity by generating an AI personalized or
              basic summary, calculated based on your task statistics and
              completion rates.
            </ModalDescription>
          </HeaderContent>
          <CloseButton onClick={onClose}>×</CloseButton>
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
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <SaveButton
            onClick={onSave}
            disabled={isGenerating || selectedOption === null}
          >
            {isGenerating ? "Generating..." : "Save"}
          </SaveButton>
        </ActionsContainer>
      </ModalContent>
    </ModalOverlay>
  );
}

export default ProductivitySummarySelectionModal;
