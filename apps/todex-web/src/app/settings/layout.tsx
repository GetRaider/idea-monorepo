"use client";

import type { ReactNode } from "react";

import { CanvasColumn } from "@components/CanvasColumn";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="my-2 mr-2 flex w-full min-w-0 overflow-hidden rounded-xl border border-border bg-sidebar">
      <CanvasColumn>{children}</CanvasColumn>
    </div>
  );
}
