"use client";

import type { ReactNode } from "react";

import { CanvasColumn } from "@components/CanvasColumn";
import { ModuleSurface } from "@components/module-surface";

import { DocsModuleSidebar } from "./docs-sidebar";
import { DocsProvider } from "./docs-provider";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsProvider>
      <ModuleSurface>
        <DocsModuleSidebar />
        <CanvasColumn>{children}</CanvasColumn>
      </ModuleSurface>
    </DocsProvider>
  );
}
