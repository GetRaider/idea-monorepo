"use client";

import { Dialog } from "./Dialog";
import {
  ConfirmBody,
  ConfirmActions,
  ConfirmCancelBtn,
  ConfirmDangerBtn,
} from "./Dialog.styles";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Dialog title={title} onClose={onClose} showCloseButton>
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
