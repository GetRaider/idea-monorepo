import { cn } from "@/lib/styles/utils";

import type { SidePanelResponsiveMode } from "./SidePanel.types";

export function getSidePanelColumnClassName(
  expanded: boolean,
  responsive: SidePanelResponsiveMode,
): string {
  const base =
    "relative flex shrink-0 flex-col overflow-visible transition-[width,opacity,min-width,max-height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none lg:min-h-0 lg:max-h-full lg:self-stretch";

  if (!expanded) {
    return cn(
      base,
      "pointer-events-none opacity-0",
      getSidePanelCollapsedColumnClassName(responsive),
    );
  }

  return cn(
    base,
    responsive === "stack" && "max-lg:opacity-100",
    responsive === "fixed" && "max-lg:opacity-100",
    "opacity-100",
    getSidePanelExpandedColumnClassName(responsive),
  );
}

function getSidePanelCollapsedColumnClassName(
  responsive: SidePanelResponsiveMode,
): string {
  if (responsive === "stack") {
    return "max-h-0 min-w-0 w-0 overflow-hidden lg:max-h-none lg:w-0 lg:min-w-0 lg:opacity-0";
  }
  return "lg:pointer-events-none lg:w-0 lg:min-w-0 lg:opacity-0";
}

function getSidePanelExpandedColumnClassName(
  responsive: SidePanelResponsiveMode,
): string {
  if (responsive === "stack") {
    return "max-lg:max-h-[min(40vh,420px)] max-lg:w-full lg:opacity-100";
  }
  if (responsive === "fixed") {
    return "lg:opacity-100";
  }
  return "";
}

export function getSidePanelColumnStyle(
  expanded: boolean,
  panelWidthPx: number,
): { width: number | string; minWidth?: number } {
  if (!expanded) {
    return { width: 0, minWidth: 0 };
  }
  return { width: `min(${panelWidthPx}px, 100%)` };
}

export function getSidePanelContentMinWidthStyle(
  expanded: boolean,
  responsive: SidePanelResponsiveMode,
  panelWidthPx: number,
): { minWidth: number } | undefined {
  if (!expanded || responsive !== "fixed") {
    return undefined;
  }
  return { minWidth: panelWidthPx };
}
