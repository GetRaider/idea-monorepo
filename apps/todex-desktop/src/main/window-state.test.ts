import { describe, expect, it } from "vitest";

import { parseWindowState, placeWindow } from "./window-state";

const laptop = { x: 0, y: 0, width: 1440, height: 900 };

describe("window state", () => {
  it("centers the default size on the primary work area", () => {
    expect(placeWindow(null, [laptop])).toEqual({
      bounds: { x: 80, y: 50, width: 1280, height: 800 },
      maximized: false,
    });
  });

  it("restores an on-screen window and recenters one that missed every display", () => {
    const saved = {
      bounds: { x: 40, y: 30, width: 1100, height: 700 },
      maximized: true,
    };
    expect(placeWindow(saved, [laptop])).toEqual(saved);
    expect(
      placeWindow(
        {
          bounds: { x: -4000, y: 20, width: 1000, height: 640 },
          maximized: false,
        },
        [laptop],
      ).bounds,
    ).toMatchObject({ x: 220, y: 130, width: 1000, height: 640 });
  });

  it("rejects garbage and clamps a saved size up to the minimum", () => {
    expect(parseWindowState(null)).toBeNull();
    expect(parseWindowState({ x: 0, y: 0, width: 1280 })).toBeNull();
    expect(
      parseWindowState({
        x: 1,
        y: 2,
        width: 100,
        height: 100,
        maximized: true,
      }),
    ).toEqual({
      bounds: { x: 1, y: 2, width: 960, height: 600 },
      maximized: true,
    });
  });
});
