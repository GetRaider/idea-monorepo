import { describe, expect, it } from "vitest";

import {
  GOOGLE_EVENT_COLOR_HEX_BY_ID,
  googleEventColorIdToHex,
  hexToGoogleEventColorId,
} from "./google-calendar-event-colors";

describe("googleEventColorIdToHex", () => {
  it("maps known Google event color ids", () => {
    expect(googleEventColorIdToHex("7")).toBe("#039be5");
    expect(googleEventColorIdToHex("11")).toBe("#d50000");
  });

  it("accepts numeric color ids", () => {
    expect(googleEventColorIdToHex(7)).toBe("#039be5");
  });

  it("maps hex to nearest Google color id", () => {
    expect(hexToGoogleEventColorId("#d50000")).toBe("11");
    expect(hexToGoogleEventColorId("#039be5")).toBe("7");
  });

  it("prefers Colors API palette when provided", () => {
    expect(
      googleEventColorIdToHex("1", {
        event: { "1": { background: "#a4bdfc", foreground: "#1d1d1d" } },
        calendar: {},
      }),
    ).toBe("#a4bdfc");
  });

  it("returns undefined for missing or unknown ids", () => {
    expect(googleEventColorIdToHex(undefined)).toBeUndefined();
    expect(googleEventColorIdToHex("")).toBeUndefined();
    expect(googleEventColorIdToHex("99")).toBeUndefined();
  });

  it("covers all documented event color ids", () => {
    for (let index = 1; index <= 11; index += 1) {
      const key = String(index);
      expect(GOOGLE_EVENT_COLOR_HEX_BY_ID[key]).toMatch(/^#[0-9a-f]{6}$/);
      expect(googleEventColorIdToHex(key)).toBe(
        GOOGLE_EVENT_COLOR_HEX_BY_ID[key],
      );
    }
  });
});
