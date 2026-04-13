"use client";

import { useState } from "react";
import { FiUser, FiAlertTriangle } from "react-icons/fi";

import { useGuestAnonymousSignIn } from "@/hooks/auth/useGuestAnonymousSignIn";
import { AuthSecondaryButton } from "@/components/auth/AuthButtons";
import {
  JoinWhitelistDialog,
  JoinWhitelistOutlineButton,
} from "./JoinWhitelistDialog";
import { GuestDialog } from "./GuestDialog";
import { OrDivider } from "./OtherActions";

export function WhitelistRestrictedAuthPanel({
  isErrorPage = false,
}: {
  isErrorPage?: boolean;
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

  return (
    <div className="w-full space-y-5">
      <div className="space-y-3 text-center">
        <p className="pb-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          <FiAlertTriangle className="mr-2 inline-block size-5" />
          Currently, only whitelisted users are allowed.
        </p>
        {isErrorPage ? (
          <p className="pb-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            You are not on the list yet.
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <JoinWhitelistOutlineButton
          onClick={() => setJoinWhitelistOpen(true)}
        />

        <OrDivider />

        <AuthSecondaryButton
          onClick={openGuestModal}
          disabled={isGuestBusy}
          loading={isGuestBusy}
        >
          <FiUser className="size-5" /> Continue as Guest
        </AuthSecondaryButton>
        {guestError ? (
          <p className="text-center text-sm text-red-400" role="alert">
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
