"use client";

import type { ReactNode } from "react";

import { CanvasColumn } from "@components/CanvasColumn";
import { ModuleSurface } from "@components/module-surface";

import { ExecutionSidebar } from "./execution-sidebar";

export default function ExecutionLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleSurface>
      <ExecutionSidebar />
      <CanvasColumn>{children}</CanvasColumn>
    </ModuleSurface>
  );
}
