import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";

export function StopDialog({
  title = "Stop session?",
  body,
  canSave,
  isBusy,
  onSave,
  onDiscard,
  onDismiss,
}: StopDialogProps) {
  const dialogBody =
    body ??
    (canSave
      ? "Save keeps this session in history. Discard removes it."
      : "No time recorded yet — you can only discard this session.");

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isBusy) {
          onDismiss();
        }
      }}
    >
      <DialogContent overlayDismiss={false}>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{dialogBody}</DialogDescription>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" disabled={isBusy} onClick={onDiscard}>
            Discard
          </Button>
          {canSave ? (
            <Button disabled={isBusy} onClick={onSave}>
              Save
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface StopDialogProps {
  title?: string;
  body?: string;
  canSave: boolean;
  isBusy: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onDismiss: () => void;
}
