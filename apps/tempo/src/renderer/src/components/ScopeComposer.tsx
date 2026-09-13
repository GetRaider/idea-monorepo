import type { ReactNode } from "react";

import { useScopeDictation } from "../hooks";
import { cn } from "../lib/cn";

export function ScopeComposer({
  value,
  disabled,
  onChange,
}: ScopeComposerProps) {
  const dictation = useScopeDictation({
    disabled,
    onTranscript: (transcript) => {
      onChange(value.trim().length === 0 ? transcript : `${value.trim()} ${transcript}`);
    },
  });
  const isRecording = dictation.phase === "recording";
  const isTranscribing = dictation.phase === "transcribing";
  const placeholder = isTranscribing
    ? "Transcribing..."
    : "What you'll work on this session";

  return (
    <div className="z-[1] flex w-[min(440px,86vw)] flex-col gap-1.5">
      <div
        className={cn(
          "relative h-[72px] rounded-[11px] border border-tempo-line bg-tempo-panel",
          disabled
            ? "opacity-40"
            : "focus-within:border-tempo-line-2",
        )}
      >
        <textarea
          className={cn(
            "h-full w-full resize-none rounded-[11px] border-0 bg-transparent py-3 pl-3.5 pr-12 text-sm placeholder:text-tempo-faint",
            disabled
              ? "cursor-not-allowed text-tempo-muted"
              : "text-tempo-text",
          )}
          value={value}
          disabled={disabled || isRecording || isTranscribing}
          rows={2}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        {isRecording ? (
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <div className="flex h-8 items-end gap-[2px] py-1" aria-hidden>
              {dictation.waveformLevels.map((level, index) => (
                <span
                  key={index}
                  className="w-[1.5px] rounded-full bg-tempo-muted"
                  style={{ height: `${Math.max(2, level * 12)}px` }}
                />
              ))}
            </div>
            <CaptureButton
              ariaLabel="Discard dictation"
              onClick={dictation.cancel}
            >
              <CloseIcon />
            </CaptureButton>
            <CaptureButton
              ariaLabel="Use dictation"
              onClick={dictation.confirm}
            >
              <CheckIcon />
            </CaptureButton>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || isTranscribing}
            aria-label="Start dictation"
            className="absolute bottom-2 right-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 text-tempo-muted hover:text-tempo-text disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => {
              void dictation.start();
            }}
          >
            <MicIcon />
          </button>
        )}
      </div>
      {dictation.errorMessage !== null ? (
        <p className="m-0 text-xs text-tempo-danger">{dictation.errorMessage}</p>
      ) : null}
    </div>
  );
}

function CaptureButton({
  ariaLabel,
  onClick,
  children,
}: CaptureButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 text-tempo-muted hover:text-tempo-text"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 11a5 5 0 0 0 10 0M12 16v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M5 12.5 9.5 17 19 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ScopeComposerProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

interface CaptureButtonProps {
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
}
