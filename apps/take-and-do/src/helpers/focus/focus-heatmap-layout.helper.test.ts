import { describe, expect, it } from "vitest";
import {
  getFocusHeatmapCellClassName,
  getFocusHeatmapGapClassName,
  getFocusHeatmapColumnSplitClassName,
  getFocusHeatmapGridClassName,
} from "./focus-heatmap-layout.helper";

describe("focus heatmap layout", () => {
  it("uses fixed square analytics cells with room between columns", () => {
    const cellClassName = getFocusHeatmapCellClassName("analytics");

    expect(cellClassName).toContain("size-5");
    expect(cellClassName).not.toContain("w-full");
    expect(cellClassName).not.toContain("h-3");
    expect(cellClassName).not.toContain("w-3");
    expect(getFocusHeatmapGapClassName("analytics")).toBe("gap-2");
    expect(getFocusHeatmapColumnSplitClassName("analytics")).toBe(
      "w-4 shrink-0",
    );
  });

  it("keeps compact fixed cells for non-analytics layouts", () => {
    expect(getFocusHeatmapCellClassName("default")).toBe(
      "h-3 w-3 shrink-0 rounded-[3px]",
    );
    expect(getFocusHeatmapCellClassName("default", true)).toBe(
      "h-2.5 w-2.5 shrink-0 rounded-[2px]",
    );
    expect(getFocusHeatmapGapClassName("default")).toBe("gap-[3px]");
  });

  it("stretches the analytics grid across the available section width", () => {
    expect(getFocusHeatmapGridClassName("analytics")).toContain("w-full");
    expect(getFocusHeatmapGridClassName("default")).toBe("flex w-fit");
  });
});
