"use client";

import type { ReactNode } from "react";

import { CanvasColumn } from "@components/CanvasColumn";

import { OverviewSidebar } from "./overview-sidebar";

export default function OverviewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 mr-2 flex w-full min-w-0 overflow-hidden rounded-xl border border-border bg-sidebar">
      <OverviewSidebar />
      <CanvasColumn>{children}</CanvasColumn>
    </div>
  );
}
