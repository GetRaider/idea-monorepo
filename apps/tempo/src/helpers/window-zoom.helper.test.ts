import { describe, expect, it } from "vitest";

import { resolveZoomFactor } from "./window-zoom.helper";

describe("resolveZoomFactor", () => {
  it("is 1 at the design size", () => {
    expect(resolveZoomFactor(980, 720)).toBe(1);
  });

  it("floors at 0.85 for the minimum window", () => {
    expect(resolveZoomFactor(720, 640)).toBe(0.85);
  });

  it("caps at 1.25 for large windows", () => {
    expect(resolveZoomFactor(2000, 1600)).toBe(1.25);
  });
});
