export type FocusHeatmapSize = "default" | "analytics";

export function getFocusHeatmapCellClassName(
  size: FocusHeatmapSize,
  embedded = false,
): string {
  if (size === "analytics") {
    return "size-5 shrink-0 rounded-[3px]";
  }

  return embedded
    ? "h-2.5 w-2.5 shrink-0 rounded-[2px]"
    : "h-3 w-3 shrink-0 rounded-[3px]";
}

export function getFocusHeatmapGapClassName(size: FocusHeatmapSize): string {
  if (size === "analytics") {
    return "gap-2";
  }

  return "gap-[3px]";
}

export function getFocusHeatmapGridClassName(size: FocusHeatmapSize): string {
  if (size === "analytics") {
    return "flex w-full min-w-0";
  }

  return "flex w-fit";
}

export function getFocusHeatmapWeekColumnClassName(
  size: FocusHeatmapSize,
): string | null {
  if (size !== "analytics") return null;

  return "flex min-h-0 min-w-0 flex-1 flex-col items-center";
}

export function getFocusHeatmapDaySlotClassName(
  size: FocusHeatmapSize,
): string | null {
  if (size !== "analytics") return null;

  return null;
}

export function getFocusHeatmapColumnSplitClassName(
  size: FocusHeatmapSize,
): string | null {
  if (size !== "analytics") return null;

  return "w-4 shrink-0";
}
