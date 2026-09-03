import { Button, ButtonRow } from "../App.styles";
import {
  DialogBody,
  DialogPanel,
  DialogTitle,
  Overlay,
} from "./ManualRecordDialog.styles";

export function StopDialog({
  title = "Stop session?",
  body,
  canSave,
  isBusy,
  onSave,
  onDiscard,
}: StopDialogProps) {
  const dialogBody =
    body ??
    (canSave
      ? "Save keeps this session in history. Discard removes it."
      : "No time recorded yet — you can only discard this session.");

  return (
    <Overlay>
      <DialogPanel>
        <DialogTitle>{title}</DialogTitle>
        <DialogBody>{dialogBody}</DialogBody>
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
  title?: string;
  body?: string;
  canSave: boolean;
  isBusy: boolean;
  onSave: () => void;
  onDiscard: () => void;
}
