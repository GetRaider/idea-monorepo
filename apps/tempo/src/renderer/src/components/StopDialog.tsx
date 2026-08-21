import { Button, ButtonRow } from "../App.styles";
import {
  DialogBody,
  DialogPanel,
  DialogTitle,
  Overlay,
} from "./ManualRecordDialog.styles";

export function StopDialog({
  canSave,
  isBusy,
  onSave,
  onDiscard,
}: StopDialogProps) {
  return (
    <Overlay>
      <DialogPanel>
        <DialogTitle>Stop session?</DialogTitle>
        <DialogBody>
          {canSave
            ? "Save keeps this session in history. Discard removes it."
            : "No time recorded yet — you can only discard this session."}
        </DialogBody>
        <ButtonRow>
          <Button
            type="button"
            $variant="ghost"
            disabled={isBusy}
            onClick={onDiscard}
          >
            Discard
          </Button>
          {canSave ? (
            <Button type="button" disabled={isBusy} onClick={onSave}>
              Save
            </Button>
          ) : null}
        </ButtonRow>
      </DialogPanel>
    </Overlay>
  );
}

interface StopDialogProps {
  canSave: boolean;
  isBusy: boolean;
  onSave: () => void;
  onDiscard: () => void;
}
