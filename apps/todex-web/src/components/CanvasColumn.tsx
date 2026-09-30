"use client";

import type { ReactNode } from "react";

export function CanvasColumn({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col border-l border-border bg-canvas">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
