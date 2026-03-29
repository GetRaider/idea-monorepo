"use client";

import { authClient } from "@/lib/auth-client";

export function GuestBanner() {
  const { data: session } = authClient.useSession();

  if (!session?.user?.isAnonymous) return null;

  return (
    <div
      className="w-full border-b border-border-app bg-nav-sidebar-bg px-4 py-1.5 text-center text-xs leading-snug text-text-primary"
      role="status"
    >
      You&apos;re signed in anonymously as a guest 👀 — your work progress lives
      within this session. Sign in to save your work progress.
    </div>
  );
}
