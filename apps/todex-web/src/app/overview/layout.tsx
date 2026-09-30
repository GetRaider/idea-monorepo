"use client";

import type { ReactNode } from "react";

import { CanvasColumn } from "@components/CanvasColumn";

export default function OverviewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="my-2 mr-2 flex w-full min-w-0 overflow-hidden rounded-xl border border-border bg-sidebar">
      <aside className="flex h-full w-[240px] shrink-0 flex-col px-3 pt-3">
        <p className="px-2 text-sm text-muted-foreground">Pinned</p>
      </aside>
      <CanvasColumn>{children}</CanvasColumn>
    </div>
  );
}
