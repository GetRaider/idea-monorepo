"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { TooltipProvider } from "@repo/ui";

import { AppNavRail } from "./AppNavRail";
import { AuthGuard } from "./AuthGuard";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/sign-in") {
    return <TooltipProvider>{children}</TooltipProvider>;
  }

  return (
    <TooltipProvider>
      <AuthGuard>
        <div className="flex min-h-screen">
          <AppNavRail />
          <div className="min-h-screen min-w-0 flex-1">{children}</div>
        </div>
      </AuthGuard>
    </TooltipProvider>
  );
}
