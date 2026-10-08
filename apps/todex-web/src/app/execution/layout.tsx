"use client";

import type { ReactNode } from "react";

import { CanvasColumn } from "@components/CanvasColumn";

import { ExecutionSidebar } from "./execution-sidebar";

export default function ExecutionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="my-2 mr-2 flex w-full min-w-0 overflow-hidden rounded-xl border border-border bg-sidebar">
      <ExecutionSidebar />
      <CanvasColumn>{children}</CanvasColumn>
    </div>
  );
}
