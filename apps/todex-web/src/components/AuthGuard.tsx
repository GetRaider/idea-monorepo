"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@lib/auth-client";
import { env } from "@lib/env";

export function AuthGuard({ children }: { children: ReactNode }) {
  if (env.auth.disabled) return <>{children}</>;
  return <SessionAuthGuard>{children}</SessionAuthGuard>;
}

function SessionAuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!session?.user) return null;
  return <>{children}</>;
}
