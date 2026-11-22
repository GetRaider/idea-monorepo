import { describe, expect, it } from "vitest";

import { MARKDOWN_HEADING_PATTERN, markdownHeadingLevel } from "./markdown-heading-shortcuts";

describe("markdown heading shortcuts", () => {
  it("maps # / ## / ### to the Heading 1-3 levels used by the slash menu", () => {
    expect(["# ", "## ", "### "].map((input) => {
      const match = MARKDOWN_HEADING_PATTERN.exec(input);
      return match ? markdownHeadingLevel(match[1] ?? "") : null;
    })).toEqual([2, 3, 4]);
  });

  it("ignores deeper headings and text without a trailing space", () => {
    expect(MARKDOWN_HEADING_PATTERN.test("#### ")).toBe(false);
    expect(MARKDOWN_HEADING_PATTERN.test("#")).toBe(false);
  });
});
