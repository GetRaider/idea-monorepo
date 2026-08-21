import { describe, expect, it } from "vitest";

import { encodeAppIconPng, encodeTrayTemplatePng } from "./icon.helper";

describe("encodeRingPng", () => {
  it("writes a PNG for the tray template and app icon", () => {
    const trayPng = encodeTrayTemplatePng(16);
    const appPng = encodeAppIconPng(32);

    expect(trayPng.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(appPng.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
    expect(appPng.byteLength).toBeGreaterThan(trayPng.byteLength);
  });
});

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
