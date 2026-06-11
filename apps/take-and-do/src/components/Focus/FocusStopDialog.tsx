"use client";

import {
  ConfirmActions,
  ConfirmBody,
  ConfirmCancelBtn,
  Dialog,
} from "@/components/Dialogs";
import { PrimaryButton } from "@/components/Buttons";
import { useFocusSessionContext } from "@/contexts/FocusSessionContext";

export function FocusStopDialog() {
  const {
    systemState,
    canSaveOnStop,
    savePartialSession,
    discardSession,
    savePartialBreak,
    discardBreak,
  } = useFocusSessionContext();

  const isFocusStop = systemState === "stopping";
  const isBreakStop = systemState === "break_stopping";
  const isOpen = isFocusStop || isBreakStop;

  if (!isOpen) return null;

  const title = isBreakStop ? "Stop break?" : "Stop focus session?";
  const description = canSaveOnStop
    ? "Save keeps this session in your history. Discard removes it entirely."
    : "No time recorded yet — you can only discard this session.";

  const handleSave = () => {
    if (isBreakStop) savePartialBreak();
    else savePartialSession();
  };

  const handleDiscard = () => {
    if (isBreakStop) discardBreak();
    else discardSession();
  };

  return (
    <Dialog
      title={title}
      onClose={handleDiscard}
      showCloseButton={false}
      maxWidth={440}
    >
      <ConfirmBody>{description}</ConfirmBody>
      <ConfirmActions>
        <ConfirmCancelBtn type="button" onClick={handleDiscard}>
          Discard
        </ConfirmCancelBtn>
        {canSaveOnStop ? (
          <PrimaryButton type="button" size="sm" onClick={handleSave}>
            Save
          </PrimaryButton>
        ) : null}
      </ConfirmActions>
    </Dialog>
  );
}

export function FocusBreakSuggestionDialog() {
  const { systemState, breakSuggestion, acceptBreak, skipBreak } =
    useFocusSessionContext();

  if (systemState !== "break_suggested" || !breakSuggestion) return null;

  const breakMinutes = Math.round(
    (breakSuggestion.parentPlannedFocusSeconds * 0.2) / 60,
  );

  return (
    <Dialog title="Take a break?" onClose={skipBreak} maxWidth={440}>
      <ConfirmBody>
        Focus session complete. Start a {breakMinutes}-minute break, or skip and
        return to setup.
      </ConfirmBody>
      <ConfirmActions>
        <ConfirmCancelBtn type="button" onClick={skipBreak}>
          Skip
        </ConfirmCancelBtn>
        <PrimaryButton type="button" size="sm" onClick={acceptBreak}>
          Start break
        </PrimaryButton>
      </ConfirmActions>
    </Dialog>
  );
}
