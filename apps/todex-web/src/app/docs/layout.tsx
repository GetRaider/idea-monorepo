"use client";

import type { ReactNode } from "react";

import { CanvasColumn } from "@components/CanvasColumn";

import { DocsModuleSidebar } from "./docs-sidebar";
import { DocsProvider } from "./docs-provider";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsProvider>
      <div className="my-2 mr-2 flex w-full min-w-0 overflow-hidden rounded-xl border border-border bg-sidebar">
        <DocsModuleSidebar />
        <CanvasColumn>{children}</CanvasColumn>
      </div>
    </DocsProvider>
  );
}
