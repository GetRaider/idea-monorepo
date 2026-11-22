import { describe, expect, it } from "vitest";

import { singleLineTitle, titleForEditing, titleForSaving } from "./doc-title";

describe("doc title", () => {
  it("shows the default Untitled title as an empty field", () => {
    expect(titleForEditing("Untitled")).toBe("");
    expect(titleForEditing("Roadmap")).toBe("Roadmap");
  });

  it("keeps titles on one line, including pasted multi-line text", () => {
    expect(singleLineTitle("Roadmap\nQ1")).toBe("Roadmap Q1");
    expect(singleLineTitle("A \r\n\n B")).toBe("A B");
  });

  it("saves an empty title as Untitled so body edits are never dropped", () => {
    expect(titleForSaving("   ")).toBe("Untitled");
    expect(titleForSaving(" Plan\n2026 ")).toBe("Plan 2026");
  });
});
