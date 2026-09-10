import { useState, type CSSProperties } from "react";

import { isDefaultBreakSessionName } from "../../../helpers/break.helper";
import { cn } from "../lib/cn";

import { OverflowMenu } from "./OverflowMenu";

import type { SavedSession } from "../../../shared/records.types";

export function ActivityPills({
  sessions,
  selectedSessionId,
  breakDurationMinutes,
  disabled,
  onSelect,
  onEdit,
  onDelete,
}: ActivityPillsProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <p className="m-0 text-xs text-tempo-faint">
        No saved activities yet. Name one and optionally save it.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {sessions.map((session) => {
          const isSelected = session.id === selectedSessionId;
          const isConfirmingDelete = pendingDeleteId === session.id;
          const showMinutes = isDefaultBreakSessionName(session.name);

          return (
            <div
              key={session.id}
              className={cn(
                "flex items-center gap-2 rounded-[10px] border border-tempo-line bg-transparent px-3.5 py-2 text-[13px] font-medium text-tempo-text",
                isSelected ? "border-tempo-accent" : null,
                disabled ? "opacity-40" : "hover:border-tempo-line-2 hover:bg-tempo-panel",
              )}
            >
              <button
                type="button"
                disabled={disabled}
                className="flex min-w-0 items-center gap-2.5 border-0 bg-transparent p-0 text-inherit"
                onClick={() =>
                  onSelect(isSelected ? null : session.id)
                }
              >
                <span
                  className="h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--activity-dot)]"
                  style={{ "--activity-dot": session.color } as CSSProperties}
                  aria-hidden
                />
                <span className="truncate">{session.name}</span>
                {showMinutes ? (
                  <span className="text-[11.5px] font-normal text-tempo-faint">
                    {breakDurationMinutes}m
                  </span>
                ) : null}
              </button>
              {isConfirmingDelete ? (
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="border-0 bg-transparent text-xs text-tempo-danger"
                    disabled={disabled}
                    onClick={() => {
                      void (async () => {
                        try {
                          await onDelete(session.id);
                          setPendingDeleteId(null);
                          setErrorMessage(null);
                        } catch (error) {
                          setErrorMessage(
                            error instanceof Error
                              ? error.message
                              : "Could not delete activity",
                          );
                        }
                      })();
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="border-0 bg-transparent text-xs text-tempo-muted"
                    disabled={disabled}
                    onClick={() => setPendingDeleteId(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <OverflowMenu
                  disabled={disabled}
                  items={[
                    {
                      label: "Edit",
                      onSelect: () => {
                        setPendingDeleteId(null);
                        setErrorMessage(null);
                        onEdit(session);
                      },
                    },
                    {
                      label: "Delete",
                      danger: true,
                      onSelect: () => {
                        setPendingDeleteId(session.id);
                        setErrorMessage(null);
                      },
                    },
                  ]}
                />
              )}
            </div>
          );
        })}
      </div>
      {errorMessage !== null ? (
        <p className="m-0 text-xs text-tempo-danger">{errorMessage}</p>
      ) : null}
    </>
  );
}

interface ActivityPillsProps {
  sessions: SavedSession[];
  selectedSessionId: string | null;
  breakDurationMinutes: number;
  disabled: boolean;
  onSelect: (sessionId: string | null) => void;
  onEdit: (session: SavedSession) => void;
  onDelete: (sessionId: string) => Promise<void>;
}
