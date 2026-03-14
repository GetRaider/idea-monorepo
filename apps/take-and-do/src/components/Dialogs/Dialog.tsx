"use client";

import { ReactNode } from "react";

import { CloseIcon } from "@/components/Icons";
import { CloseButton } from "@/components/Buttons";
import {
  DialogContainer,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "./Dialog.styles";

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
  maxWidth?: number;
}

export function Dialog({
  title,
  onClose,
  children,
  showCloseButton = true,
  maxWidth = 500,
}: DialogProps) {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <DialogOverlay onClick={handleOverlayClick}>
      <DialogContainer
        onClick={(e) => e.stopPropagation()}
        $maxWidth={maxWidth}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {showCloseButton && (
            <CloseButton onClick={onClose}>
              <CloseIcon />
            </CloseButton>
          )}
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
      </DialogContainer>
    </DialogOverlay>
  );
}
