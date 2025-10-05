"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@lib/auth-client";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#f8fafc",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!session?.user) {
    return null;
  }

  return <>{children}</>;
}
