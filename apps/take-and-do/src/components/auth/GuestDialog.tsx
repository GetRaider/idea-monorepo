"use client";

import { Dialog } from "@/components/Dialogs";

export function GuestDialog({
  guestIntent,
  guestOtherText,
  isBusy,
  onCancel,
  onConfirm,
  onIntentChange,
  onOtherTextChange,
}: GuestIntentDialogProps) {
  const canConfirm =
    guestIntent === "exploring" ||
    guestIntent === "portfolio" ||
    (guestIntent === "other" && guestOtherText.trim().length > 0);
  const options = [
    {
      label: "Exploring for potential use",
      description: "Considering using the platform for my own needs",
      selected: guestIntent === "exploring",
      onSelect: () => onIntentChange("exploring"),
      disabled: isBusy,
    },
    {
      label: "Reviewing a portfolio",
      description: "Checking this out as part of someone's work",
      selected: guestIntent === "portfolio",
      onSelect: () => onIntentChange("portfolio"),
      disabled: isBusy,
    },
    {
      label: "Other",
      description: "Describe any other reason you're here",
      selected: guestIntent === "other",
      onSelect: () => onIntentChange("other"),
      disabled: isBusy,
    },
  ];

  return (
    <Dialog
      title="Continue as Guest"
      subtitle="Continue as a Guest to explore the platform. Your work progress stays until you logout or 7 days expires."
      onClose={onCancel}
      maxWidth={620}
    >
      <p className="m-0 text-m text-[var(--text-primary)]">
        What brings you here today?
      </p>

      <div className="mt-4 space-y-2">
        {options.map((option, index) => (
          <IntentOption
            key={index}
            label={option.label}
            description={option.description}
            selected={option.selected}
            onSelect={option.onSelect}
            disabled={option.disabled}
          />
        ))}
      </div>

      {guestIntent === "other" ? (
        <div className="mt-3">
          <label
            htmlFor="guest-intent-other"
            className="mb-1 block text-xs text-[var(--text-secondary)]"
          >
            Reason
          </label>
          <input
            id="guest-intent-other"
            type="text"
            value={guestOtherText}
            onChange={(event) => onOtherTextChange(event.target.value)}
            disabled={isBusy}
            className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          className="text-sm text-[var(--text-secondary)] underline-offset-2 hover:underline disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isBusy || !canConfirm}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          Continue
        </button>
      </div>
    </Dialog>
  );
}

function IntentOption({
  label,
  description,
  selected,
  onSelect,
  disabled,
}: IntentOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`w-full rounded-lg border p-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:opacity-50 ${
        selected
          ? "border-[var(--brand-primary)] bg-[var(--input-bg)]"
          : "border-[var(--border-color)] hover:border-[var(--input-border-hover)]"
      }`}
    >
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      <span className="mt-0.5 block text-xs text-[var(--text-tertiary)]">
        {description}
      </span>
    </button>
  );
}

export type GuestIntent = "exploring" | "portfolio" | "other" | null;

type GuestIntentDialogProps = {
  guestIntent: GuestIntent;
  guestOtherText: string;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onIntentChange: (value: GuestIntent) => void;
  onOtherTextChange: (value: string) => void;
};

type IntentOptionProps = {
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
};
