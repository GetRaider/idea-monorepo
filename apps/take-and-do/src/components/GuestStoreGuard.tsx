"use client";

import { useEffect } from "react";

import { useIsAnonymous } from "@/hooks/use-is-anonymous";
import { guestStoreHelper } from "@/lib/guest-store";

export function GuestStoreGuard() {
  const isAnonymous = useIsAnonymous();

  useEffect(() => {
    const store = guestStoreHelper.read();
    if (store && !isAnonymous) {
      guestStoreHelper.clear();
    }
  }, [isAnonymous]);

  return null;
}
