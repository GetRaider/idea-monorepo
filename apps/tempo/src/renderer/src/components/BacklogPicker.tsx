import { useState } from "react";

import {
  BacklogAccent,
  BacklogActionButton,
  BacklogCard,
  BacklogCardHeader,
  BacklogCardInner,
  BacklogCardName,
  BacklogColorDot,
  BacklogDeleteRow,
  BacklogRow,
  BacklogStartButton,
  BacklogStartContent,
  BacklogTitleButton,
  PickerHint,
} from "./BacklogPicker.styles";
import { OverflowMenu } from "./OverflowMenu";

import type { SavedSession } from "../../../shared/records.types";

export function BacklogPicker({
  sessions,
  selectedSessionId,
  disabled,
  onSelect,
  onPlay,
  onEdit,
  onDelete,
}: BacklogPickerProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <>
      {sessions.length === 0 ? (
        <PickerHint>
          No saved sessions yet. Name one and optionally save it.
        </PickerHint>
      ) : (
        <BacklogRow>
          {sessions.map((session) => (
            <BacklogSessionCard
              key={session.id}
              session={session}
              isSelected={session.id === selectedSessionId}
              disabled={disabled}
              isConfirmingDelete={pendingDeleteId === session.id}
              onSelect={() => {
                setPendingDeleteId(null);
                onSelect(session.id === selectedSessionId ? null : session.id);
              }}
              onPlay={() => onPlay(session.id)}
              onEdit={() => {
                setPendingDeleteId(null);
                setErrorMessage(null);
                onEdit(session);
              }}
              onStartDelete={() => {
                setPendingDeleteId(session.id);
                setErrorMessage(null);
              }}
              onCancelDelete={() => setPendingDeleteId(null)}
              onConfirmDelete={() => {
                void (async () => {
                  try {
                    await onDelete(session.id);
                    setPendingDeleteId(null);
                    setErrorMessage(null);
                  } catch (error) {
                    setErrorMessage(
                      error instanceof Error
                        ? error.message
                        : "Could not delete session",
                    );
                  }
                })();
              }}
            />
          ))}
        </BacklogRow>
      )}
      {errorMessage !== null ? <PickerHint>{errorMessage}</PickerHint> : null}
    </>
  );
}

function BacklogSessionCard({
  session,
  isSelected,
  disabled,
  isConfirmingDelete,
  onSelect,
  onPlay,
  onEdit,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
}: BacklogSessionCardProps) {
  return (
    <BacklogCard $active={isSelected}>
      <BacklogAccent $color={session.color} aria-hidden />
      <BacklogCardInner>
        <BacklogCardHeader>
          <BacklogTitleButton
            type="button"
            disabled={disabled}
            onClick={onSelect}
          >
            <BacklogColorDot $color={session.color} aria-hidden />
            <BacklogCardName>{session.name}</BacklogCardName>
          </BacklogTitleButton>
          {isConfirmingDelete ? null : (
            <OverflowMenu
              disabled={disabled}
              items={[
                { label: "Edit", onSelect: onEdit },
                { label: "Delete", danger: true, onSelect: onStartDelete },
              ]}
            />
          )}
        </BacklogCardHeader>
        {isConfirmingDelete ? (
          <BacklogDeleteRow>
            <BacklogActionButton
              type="button"
              $danger
              disabled={disabled}
              onClick={onConfirmDelete}
            >
              Confirm
            </BacklogActionButton>
            <BacklogActionButton
              type="button"
              disabled={disabled}
              onClick={onCancelDelete}
            >
              Cancel
            </BacklogActionButton>
          </BacklogDeleteRow>
        ) : (
          <BacklogStartButton
            type="button"
            disabled={disabled}
            onClick={onPlay}
          >
            <BacklogStartContent>
              Start
              <span aria-hidden>▶</span>
            </BacklogStartContent>
          </BacklogStartButton>
        )}
      </BacklogCardInner>
    </BacklogCard>
  );
}

interface BacklogPickerProps {
  sessions: SavedSession[];
  selectedSessionId: string | null;
  disabled: boolean;
  onSelect: (sessionId: string | null) => void;
  onPlay: (sessionId: string) => void;
  onEdit: (session: SavedSession) => void;
  onDelete: (sessionId: string) => Promise<void>;
}

interface BacklogSessionCardProps {
  session: SavedSession;
  isSelected: boolean;
  disabled: boolean;
  isConfirmingDelete: boolean;
  onSelect: () => void;
  onPlay: () => void;
  onEdit: () => void;
  onStartDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}
