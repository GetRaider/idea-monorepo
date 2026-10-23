import { describe, expect, it } from "vitest";

import { splitText, stripHtml } from "./chunk-text";

describe("splitText", () => {
  it("returns one chunk for a short note", () => {
    expect(splitText("Hello")).toEqual(["Hello"]);
  });

  it("splits a long note on a paragraph break", () => {
    const first = "a".repeat(500);
    const second = "b".repeat(500);
    expect(splitText(`${first}\n${second}`)).toEqual([first, second]);
  });

  it("strips tags from task descriptions", () => {
    expect(stripHtml("<p>Hello <strong>there</strong></p>")).toBe("Hello there");
  });
});
