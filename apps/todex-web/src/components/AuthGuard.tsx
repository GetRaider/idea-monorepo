"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@lib/auth-client";
import { env } from "@lib/env";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!env.auth.enabled || isPending || session?.user) return;
    const next = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
    router.replace(`/sign-in?next=${encodeURIComponent(next)}`);
  }, [isPending, pathname, router, searchParams, session]);

  if (!env.auth.enabled) return children;

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!session?.user) return null;
  return children;
}
