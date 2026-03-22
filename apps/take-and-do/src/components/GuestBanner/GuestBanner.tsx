"use client";

import { usePathname } from "next/navigation";

import { authClient } from "@/lib/auth-client";

const isAnonymousUser = (user: unknown): user is { isAnonymous: boolean } =>
  typeof user === "object" &&
  user !== null &&
  "isAnonymous" in user &&
  typeof (user as { isAnonymous: unknown }).isAnonymous === "boolean";

export function GuestBanner() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    !session?.user ||
    !isAnonymousUser(session.user) ||
    !session.user.isAnonymous
  ) {
    return null;
  }

  return (
    <div
      className="box-border border-b border-[var(--border-color)] bg-[var(--nav-sidebar-bg)] px-3 py-1.5 pl-4 pr-8 text-center text-xs leading-snug text-[var(--text-secondary)] sm:px-4 sm:py-2 sm:pr-12 sm:text-sm"
      role="status"
    >
      You&apos;re signed in anonymously 👀 — this session is temporary. Sign in
      with Google or email to keep your work.
    </div>
  );
}
