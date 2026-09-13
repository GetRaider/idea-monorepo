import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { isDefaultBreakSessionName } from "../../../helpers/break.helper";
import {
  clampSessionName,
  SESSION_NAME_MAX_LENGTH,
  shouldOfferSaveAsActivity,
} from "../../../helpers/session.helper";
import { cn } from "../lib/cn";

import { OverflowMenu } from "./OverflowMenu";
import { Checkbox } from "./ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";

import type { SavedSession } from "../../../shared/records.types";

export function SessionCombobox({
  name,
  sessions,
  selectedSessionId,
  saveToBacklog,
  disabled,
  breakDurationMinutes,
  errorMessage,
  onNameChange,
  onSelectActivity,
  onSaveToBacklogChange,
  onEdit,
  onDelete,
}: SessionComboboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const keepListOpenRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    const normalizedQuery = name.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return sessions;
    }
    return sessions.filter((session) =>
      session.name.toLowerCase().includes(normalizedQuery),
    );
  }, [name, sessions]);
  const offerSaveAsActivity = shouldOfferSaveAsActivity(
    name,
    selectedSessionId,
    sessions.map((session) => session.name),
  );

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      setPendingDeleteId(null);
    }
  }, [disabled]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) {
        return;
      }
      if (disabled) {
        return;
      }
      event.preventDefault();
      setIsOpen(true);
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled]);

  function openList(): void {
    if (!disabled) {
      setIsOpen(true);
    }
  }

  return (
    <Popover
      modal={false}
      open={isOpen && !disabled}
      onOpenChange={(nextOpen) => {
        if (disabled) {
          return;
        }
        if (!nextOpen && keepListOpenRef.current) {
          return;
        }
        setIsOpen(nextOpen);
        if (!nextOpen) {
          setPendingDeleteId(null);
          if (saveToBacklog) {
            onSaveToBacklogChange(false);
          }
        }
      }}
    >
      <Command shouldFilter={false} className="z-[1] w-[min(420px,80vw)]">
        <PopoverAnchor asChild>
          <div
            ref={anchorRef}
            className="relative w-full rounded-[11px] border border-tempo-line bg-tempo-panel focus-within:border-tempo-line-2"
            onMouseDown={(event) => {
              if (disabled) {
                return;
              }
              if ((event.target as HTMLElement).closest("button")) {
                return;
              }
              openList();
            }}
          >
            <CommandInput
              ref={inputRef}
              value={name}
              disabled={disabled}
              spellCheck={false}
              maxLength={SESSION_NAME_MAX_LENGTH}
              placeholder="Select or Create an Activity"
              onFocus={openList}
              onValueChange={(nextName) => {
                onNameChange(clampSessionName(nextName));
                openList();
              }}
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
              {name.length > 0 || selectedSessionId !== null ? (
                <button
                  type="button"
                  disabled={disabled}
                  aria-label="Clear activity"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-tempo-faint hover:text-tempo-text disabled:cursor-not-allowed disabled:opacity-40"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    keepListOpenRef.current = true;
                    onNameChange("");
                    onSelectActivity(null);
                    setIsOpen(true);
                    inputRef.current?.focus();
                    window.setTimeout(() => {
                      keepListOpenRef.current = false;
                    }, 50);
                  }}
                >
                  ×
                </button>
              ) : null}
              <button
                type="button"
                disabled={disabled}
                aria-label="Open activities"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-tempo-muted hover:text-tempo-text disabled:cursor-not-allowed disabled:opacity-40"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (disabled) {
                    return;
                  }
                  setIsOpen((wasOpen) => !wasOpen);
                  inputRef.current?.focus();
                }}
              >
                <ChevronIcon open={isOpen} />
              </button>
            </div>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="center"
          className="w-[min(420px,80vw)] border-tempo-line-2 bg-[#101114] p-1"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => {
            if (anchorRef.current?.contains(event.target as Node)) {
              event.preventDefault();
            }
          }}
          onFocusOutside={(event) => {
            if (anchorRef.current?.contains(event.target as Node)) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (anchorRef.current?.contains(event.target as Node)) {
              event.preventDefault();
            }
          }}
        >
          <CommandList>
            {sessions.length === 0 && !offerSaveAsActivity ? (
              <CommandEmpty>
                No saved activities yet. Name one and optionally save it.
              </CommandEmpty>
            ) : null}
            {filteredSessions.length > 0 ? (
              <CommandGroup heading="Activities">
                {filteredSessions.map((session) => (
                  <SessionComboboxRow
                    key={session.id}
                    session={session}
                    isSelected={session.id === selectedSessionId}
                    showMinutes={isDefaultBreakSessionName(session.name)}
                    breakDurationMinutes={breakDurationMinutes}
                    isConfirmingDelete={pendingDeleteId === session.id}
                    onSelect={() => {
                      onSelectActivity(
                        session.id === selectedSessionId ? null : session.id,
                      );
                      setIsOpen(false);
                      setPendingDeleteId(null);
                    }}
                    onEdit={() => {
                      setPendingDeleteId(null);
                      setIsOpen(false);
                      onEdit(session);
                    }}
                    onRequestDelete={() => setPendingDeleteId(session.id)}
                    onCancelDelete={() => setPendingDeleteId(null)}
                    onConfirmDelete={async () => {
                      await onDelete(session.id);
                      setPendingDeleteId(null);
                    }}
                  />
                ))}
              </CommandGroup>
            ) : sessions.length > 0 ? (
              <p className="m-0 px-3 py-3 text-center text-xs text-tempo-faint">
                No matching activities
              </p>
            ) : null}
            {offerSaveAsActivity ? (
              <>
                {filteredSessions.length > 0 || sessions.length > 0 ? (
                  <CommandSeparator />
                ) : null}
                <CommandGroup>
                  <CommandItem
                    value="save-as-activity"
                    onSelect={() => onSaveToBacklogChange(!saveToBacklog)}
                  >
                    <Checkbox
                      checked={saveToBacklog}
                      className="pointer-events-none"
                      tabIndex={-1}
                    />
                    Save “{name.trim()}” as activity
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
          {errorMessage !== null ? (
            <p className="mb-1 mt-1 px-2 text-xs text-tempo-danger">
              {errorMessage}
            </p>
          ) : null}
        </PopoverContent>
      </Command>
    </Popover>
  );
}

function SessionComboboxRow({
  session,
  isSelected,
  showMinutes,
  breakDurationMinutes,
  isConfirmingDelete,
  onSelect,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: SessionComboboxRowProps) {
  return (
    <CommandItem
      value={session.id}
      keywords={[session.name]}
      className="group min-w-0"
      onSelect={onSelect}
    >
      <span
        className="h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--activity-dot)]"
        style={{ "--activity-dot": session.color } as CSSProperties}
        aria-hidden
      />
      <span className="min-w-0 truncate">{session.name}</span>
      {showMinutes ? (
        <span className="text-[11.5px] font-normal text-tempo-faint">
          {breakDurationMinutes}m
        </span>
      ) : null}
      {isSelected ? (
        <span className="text-[11px] font-normal text-tempo-faint">
          Selected
        </span>
      ) : null}
      {isConfirmingDelete ? (
        <div
          className="ml-auto flex shrink-0 gap-1"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent text-xs text-tempo-danger"
            onClick={() => {
              void onConfirmDelete();
            }}
          >
            Confirm
          </button>
          <button
            type="button"
            className="cursor-pointer border-0 bg-transparent text-xs text-tempo-muted"
            onClick={onCancelDelete}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div
          className="ml-auto flex shrink-0"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <OverflowMenu
            triggerClassName="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-data-[selected=true]:opacity-100 group-data-[selected=true]:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto data-[state=open]:opacity-100 data-[state=open]:pointer-events-auto"
            contentClassName="border-solid border-tempo-accent"
            items={[
              { label: "Edit", onSelect: onEdit },
              { label: "Delete", danger: true, onSelect: onRequestDelete },
            ]}
          />
        </div>
      )}
    </CommandItem>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className={cn("transition-transform duration-500 ease-in-out", open ? "rotate-180" : null)}
    >
      <path
        d="M2.5 4.25 6 7.75l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface SessionComboboxProps {
  name: string;
  sessions: SavedSession[];
  selectedSessionId: string | null;
  saveToBacklog: boolean;
  disabled: boolean;
  breakDurationMinutes: number;
  errorMessage: string | null;
  onNameChange: (name: string) => void;
  onSelectActivity: (sessionId: string | null) => void;
  onSaveToBacklogChange: (checked: boolean) => void;
  onEdit: (session: SavedSession) => void;
  onDelete: (sessionId: string) => Promise<void>;
}

interface SessionComboboxRowProps {
  session: SavedSession;
  isSelected: boolean;
  showMinutes: boolean;
  breakDurationMinutes: number;
  isConfirmingDelete: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => Promise<void>;
}
