import { Button, ButtonRow, Field, FieldLabel, TextInput } from "../App.styles";
import {
  DialogBody,
  DialogPanel,
  DialogTitle,
  Overlay,
} from "./ManualRecordDialog.styles";

export function BreakOfferDialog({
  durationMinutes,
  isBusy,
  onDurationChange,
  onStartBreak,
  onDismiss,
}: BreakOfferDialogProps) {
  return (
    <Overlay
      onClick={() => {
        if (!isBusy) {
          onDismiss();
        }
      }}
    >
      <DialogPanel
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <DialogTitle>Take a break?</DialogTitle>
        <DialogBody>
          <Field>
            <FieldLabel>Duration</FieldLabel>
            <TextInput
              value={`${durationMinutes}m`}
              disabled={isBusy}
              onChange={(event) => onDurationChange(event.target.value)}
              placeholder="e.g. 10m"
            />
          </Field>
        </DialogBody>
        <ButtonRow>
          <Button
            type="button"
            $variant="ghost"
            disabled={isBusy}
            onClick={onDismiss}
          >
            Not now
          </Button>
          <Button type="button" disabled={isBusy} onClick={onStartBreak}>
            Start break
          </Button>
        </ButtonRow>
      </DialogPanel>
    </Overlay>
  );
}

interface BreakOfferDialogProps {
  durationMinutes: number;
  isBusy: boolean;
  onDurationChange: (value: string) => void;
  onStartBreak: () => void;
  onDismiss: () => void;
}
