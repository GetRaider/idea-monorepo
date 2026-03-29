"use client";

import { useEffect } from "react";

import { useSession } from "@/lib/auth-client";
import { guestStoreHelper } from "@/lib/guest-store";
import { UserWithAnonymous } from "better-auth/plugins";

export function GuestStoreGuard() {
  const { data: session, isPending } = useSession();
  const user = session?.user as UserWithAnonymous;
  const userId = user?.id;
  const isAnonymousUser = user?.isAnonymous;

  useEffect(() => {
    if (isPending) return;
    if (!userId) return;
    if (isAnonymousUser !== false) return;

    const store = guestStoreHelper.read();
    if (store) guestStoreHelper.clear();
  }, [isPending, userId, isAnonymousUser]);

  return null;
}
