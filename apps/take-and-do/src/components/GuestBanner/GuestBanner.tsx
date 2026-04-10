"use client";

import { authClient } from "@/auth/client";

export function GuestBanner() {
  const { data: session } = authClient.useSession();

  if (!session?.user?.isAnonymous) return null;

  return (
    <div
      className="w-full border-b border-border-app bg-nav-sidebar-bg px-4 py-1.5 text-center text-xs leading-snug text-text-primary"
      role="status"
    >
      You&apos;re logged as a guest 👀 — work progress stays until you logout or
      7 days expire.
    </div>
  );
}
