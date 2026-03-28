"use client";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function GuestBanner() {
  const { data: session } = authClient.useSession();

  if (!session?.user?.isAnonymous) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-2 z-[300] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 max-[640px]:top-3 max-[640px]:max-w-[calc(100vw-1rem)]">
      <div
        className={cn(
          "pointer-events-auto max-w-full max-h-13 overflow-x-auto rounded-xl border border-border-app bg-[#1f1f1f] px-[18px] py-[18px] text-sm leading-relaxed text-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.4)]",
          "whitespace-nowrap",
        )}
        role="status"
      >
        You&apos;re signed in anonymously 👀 — this session is temporary. Sign
        in with Google or email to keep your work.
      </div>
    </div>
  );
}
