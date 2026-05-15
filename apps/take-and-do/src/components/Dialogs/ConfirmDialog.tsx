"use client";

import {
  ConfirmActions,
  ConfirmBody,
  ConfirmCancelBtn,
  ConfirmDangerBtn,
  Dialog,
} from "./dialog";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  maxWidth?: number;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  overlayClassName?: string;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  maxWidth,
  onConfirm,
  onClose,
  overlayClassName,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } finally {
      onClose();
    }
  };

  return (
    <Dialog
      title={title}
      onClose={onClose}
      showCloseButton
      maxWidth={maxWidth}
      overlayClassName={overlayClassName}
    >
      <ConfirmBody>{description}</ConfirmBody>
      <ConfirmActions>
        <ConfirmCancelBtn type="button" onClick={onClose}>
          {cancelLabel}
        </ConfirmCancelBtn>
        <ConfirmDangerBtn type="button" onClick={handleConfirm}>
          {confirmLabel}
        </ConfirmDangerBtn>
      </ConfirmActions>
    </Dialog>
  );
}
