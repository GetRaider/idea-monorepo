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
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  maxWidth,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } finally {
      onClose();
    }
  };

  return (
    <Dialog title={title} onClose={onClose} showCloseButton maxWidth={maxWidth}>
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
