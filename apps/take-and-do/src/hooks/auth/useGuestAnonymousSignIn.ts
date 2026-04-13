"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/auth/client";
import { mixpanelAnalytics } from "@/lib/analytics/maxpanel-analytics";

import type { GuestIntent } from "@/components/auth/GuestDialog";

export function useGuestAnonymousSignIn() {
  const router = useRouter();
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestIntent, setGuestIntent] = useState<GuestIntent>(null);
  const [guestOtherText, setGuestOtherText] = useState("");
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState<GuestLoadingKey>(null);

  const isGuestBusy = guestLoading !== null;

  function openGuestModal() {
    setGuestError(null);
    setGuestIntent(null);
    setGuestOtherText("");
    setGuestModalOpen(true);
  }

  async function confirmAnonymous() {
    if (!guestIntent) return;
    if (guestIntent === "other" && guestOtherText.trim().length === 0) return;
    setGuestError(null);
    setGuestLoading("anonymous");
    try {
      mixpanelAnalytics.trackEvent("Guest Visit Intent", {
        intent: guestIntent,
        intent_other_text:
          guestIntent === "other" ? guestOtherText.trim() || null : null,
        timestamp: new Date().toISOString(),
      });
      await authClient.signIn.anonymous();
      setGuestModalOpen(false);
      router.push("/overview");
      router.refresh();
    } catch (cause: unknown) {
      setGuestError(
        cause instanceof Error
          ? cause.message
          : "Could not start a guest session. Try again.",
      );
    } finally {
      setGuestLoading(null);
    }
  }

  return {
    guestModalOpen,
    guestIntent,
    guestOtherText,
    guestError,
    isGuestBusy,
    openGuestModal,
    closeGuestModal: () => setGuestModalOpen(false),
    setGuestIntent,
    setGuestOtherText,
    confirmAnonymous,
  };
}

type GuestLoadingKey = "anonymous" | null;
