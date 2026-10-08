"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { TooltipProvider } from "@repo/ui";

import { ExecutionProvider } from "../app/execution/execution-provider";
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
        <ExecutionProvider>
          <div className="flex h-screen overflow-hidden bg-background">
            <AppNavRail />
            <div className="flex min-h-0 min-w-0 flex-1">{children}</div>
          </div>
        </ExecutionProvider>
      </AuthGuard>
    </TooltipProvider>
  );
}
