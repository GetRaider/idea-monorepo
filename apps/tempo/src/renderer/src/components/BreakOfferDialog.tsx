import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "./ui/dialog";

export function BreakOfferDialog({
  durationMinutes,
  isBusy,
  onDurationChange,
  onStartBreak,
  onDismiss,
}: BreakOfferDialogProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isBusy) {
          onDismiss();
        }
      }}
    >
      <DialogContent overlayDismiss>
        <DialogTitle>Take a break?</DialogTitle>
        <div className="mt-3">
            <label className="flex flex-col gap-1 text-sm text-tempo-muted">
              Duration (minutes)
              <input
                type="number"
                min={1}
                max={60}
                className="rounded-[10px] border border-tempo-line bg-transparent px-2.5 py-1.5 text-tempo-text"
                value={durationMinutes}
                disabled={isBusy}
                onChange={(event) =>
                  onDurationChange(Number(event.target.value))
                }
              />
            </label>
          </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" disabled={isBusy} onClick={onDismiss}>
            Not now
          </Button>
          <Button disabled={isBusy} onClick={onStartBreak}>
            Start break
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BreakOfferDialogProps {
  durationMinutes: number;
  isBusy: boolean;
  onDurationChange: (minutes: number) => void;
  onStartBreak: () => void;
  onDismiss: () => void;
}
