"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@lib/auth-client";
import { env } from "@lib/env";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!env.auth.enabled || isPending || session?.user) return;
    router.replace("/sign-in");
  }, [isPending, router, session]);

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
