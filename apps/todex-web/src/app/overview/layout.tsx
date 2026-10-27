"use client";

import type { ReactNode } from "react";

import { CanvasColumn } from "@components/CanvasColumn";
import { ModuleSurface } from "@components/module-surface";

import { OverviewSidebar } from "./overview-sidebar";

export default function OverviewLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleSurface>
      <OverviewSidebar />
      <CanvasColumn>{children}</CanvasColumn>
    </ModuleSurface>
  );
}
