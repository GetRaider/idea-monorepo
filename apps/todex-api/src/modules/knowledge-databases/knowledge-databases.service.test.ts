import { describe, expect, it } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { validateKnowledgeCell } from "./knowledge-databases.service";

describe("Knowledge cell validation", () => {
  it("validates text, numbers and checkboxes", () => {
    expect(validateKnowledgeCell({ type: "title", options: [] }, "Test")).toBe("Test");
    expect(validateKnowledgeCell({ type: "number", options: [] }, 4.5)).toBe(4.5);
    expect(validateKnowledgeCell({ type: "checkbox", options: [] }, false)).toBe(false);
    expect(() => validateKnowledgeCell({ type: "number", options: [] }, "4")).toThrow(BadRequestException);
  });
  it("enforces select options and unique multi-select values", () => {
    expect(validateKnowledgeCell({ type: "select", options: ["New", "Done"] }, "Done")).toBe("Done");
    expect(validateKnowledgeCell({ type: "multi_select", options: ["A", "B"] }, ["A", "B"])).toEqual(["A", "B"]);
    expect(() => validateKnowledgeCell({ type: "select", options: ["New"] }, "Done")).toThrow(BadRequestException);
    expect(() => validateKnowledgeCell({ type: "multi_select", options: ["A"] }, ["A", "A"])).toThrow(BadRequestException);
  });
  it("only accepts genuine ISO calendar dates", () => {
    expect(validateKnowledgeCell({ type: "date", options: [] }, "2026-11-20")).toBe("2026-11-20");
    expect(() => validateKnowledgeCell({ type: "date", options: [] }, "2026-02-30")).toThrow(BadRequestException);
  });
});
