"use client";

import type { ReactNode } from "react";
import { cn } from "@repo/ui";

import { useModuleSidebar } from "./module-sidebar";

export function CanvasColumn({ children }: { children: ReactNode }) {
  const { moduleKey, open } = useModuleSidebar();
  const sidebarOpen = moduleKey != null && open;

  return (
    <div
      className={cn(
        "relative flex min-h-0 min-w-0 flex-1 flex-col bg-canvas",
        sidebarOpen && "border-l border-border",
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
