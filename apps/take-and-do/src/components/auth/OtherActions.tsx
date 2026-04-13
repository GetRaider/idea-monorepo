"use client";

import { useState } from "react";
import { FiUser } from "react-icons/fi";

import { GuestDialog } from "@/components/auth/GuestDialog";
import {
  JoinWhitelistDialog,
  JoinWhitelistOutlineButton,
} from "@/components/auth/JoinWhitelistDialog";
import { useGuestAnonymousSignIn } from "@/hooks/auth/useGuestAnonymousSignIn";
import { AuthSecondaryButton } from "@/components/auth/AuthButtons";

export function OtherActionsPanel({
  disabled: disabledFromParent = false,
}: {
  disabled?: boolean;
}) {
  const [joinWhitelistOpen, setJoinWhitelistOpen] = useState(false);
  const {
    guestModalOpen,
    guestIntent,
    guestOtherText,
    guestError,
    isGuestBusy,
    openGuestModal,
    closeGuestModal,
    setGuestIntent,
    setGuestOtherText,
    confirmAnonymous,
  } = useGuestAnonymousSignIn();

  const disabled = disabledFromParent || isGuestBusy;

  return (
    <div className="mt-8">
      <div
        className="flex flex-col rounded-xl border border-dashed border-[var(--border-color)] bg-[color-mix(in_srgb,var(--background-login)_50%,transparent)] px-5 pb-5 pt-4"
        data-testid="continue-as-guest-card"
      >
        <h2 className="m-0 text-center text-sm font-semibold text-[var(--foreground)]">
          Don&apos;t want to wait?
        </h2>
        <AuthSecondaryButton
          onClick={openGuestModal}
          disabled={disabled}
          className="mt-4"
          loading={isGuestBusy}
        >
          <FiUser className="size-5" />
          Continue as Guest
        </AuthSecondaryButton>
        <div className="mt-3">
          <OrDivider />
        </div>
        <div className="mt-3">
          <JoinWhitelistOutlineButton
            onClick={() => setJoinWhitelistOpen(true)}
            disabled={disabled}
          />
        </div>
        {guestError ? (
          <p className="mt-2 text-sm text-red-400" role="alert">
            {guestError}
          </p>
        ) : null}
      </div>

      {joinWhitelistOpen ? (
        <JoinWhitelistDialog onClose={() => setJoinWhitelistOpen(false)} />
      ) : null}

      {guestModalOpen ? (
        <GuestDialog
          guestIntent={guestIntent}
          guestOtherText={guestOtherText}
          isBusy={isGuestBusy}
          onCancel={closeGuestModal}
          onConfirm={() => void confirmAnonymous()}
          onIntentChange={setGuestIntent}
          onOtherTextChange={setGuestOtherText}
        />
      ) : null}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[var(--border-color)]" />
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
        OR
      </span>
      <div className="h-px flex-1 bg-[var(--border-color)]" />
    </div>
  );
}
