"use client";

import type { ReactNode } from "react";

import { CanvasColumn } from "@components/CanvasColumn";
import { ModuleSurface } from "@components/module-surface";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleSurface>
      <CanvasColumn>{children}</CanvasColumn>
    </ModuleSurface>
  );
}
