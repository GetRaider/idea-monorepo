"use client";

import { useState } from "react";

import {
  ConfirmActions,
  ConfirmBody,
  ConfirmCancelBtn,
  Dialog,
  DialogFormButton,
} from "@/components/Dialogs";

export function GuestImportDialog({
  folderCount,
  boardCount,
  taskCount,
  isImporting,
  onImport,
  onDiscard,
  onClose,
}: GuestImportDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImport = async () => {
    setErrorMessage(null);
    try {
      await onImport();
    } catch {
      setErrorMessage("Import failed. Try again or discard guest data.");
    }
  };

  return (
    <Dialog
      title="Import guest work?"
      subtitle="You signed in with local guest data on this device."
      onClose={onClose}
      showCloseButton={false}
      maxWidth={480}
    >
      <ConfirmBody>
        Import{" "}
        {[
          folderCount > 0
            ? `${folderCount} folder${folderCount === 1 ? "" : "s"}`
            : null,
          boardCount > 0
            ? `${boardCount} board${boardCount === 1 ? "" : "s"}`
            : null,
          taskCount > 0
            ? `${taskCount} task${taskCount === 1 ? "" : "s"}`
            : null,
        ]
          .filter(Boolean)
          .join(", ")}{" "}
        into your account? Discarding removes guest data from this browser.
        {errorMessage ? (
          <p className="mt-3 mb-0 text-sm text-red-300">{errorMessage}</p>
        ) : null}
      </ConfirmBody>
      <ConfirmActions>
        <ConfirmCancelBtn
          type="button"
          onClick={onDiscard}
          disabled={isImporting}
        >
          Discard
        </ConfirmCancelBtn>
        <DialogFormButton
          type="button"
          primary
          onClick={() => void handleImport()}
          disabled={isImporting}
        >
          {isImporting ? "Importing…" : "Import"}
        </DialogFormButton>
      </ConfirmActions>
    </Dialog>
  );
}

interface GuestImportDialogProps {
  folderCount: number;
  boardCount: number;
  taskCount: number;
  isImporting: boolean;
  onImport: () => Promise<void>;
  onDiscard: () => void;
  onClose: () => void;
}
