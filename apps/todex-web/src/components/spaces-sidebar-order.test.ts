import { describe, expect, it } from "vitest";
import { positionForDrop } from "@repo/api/todex";

const positions = new Map([
  ["a", 0],
  ["b", 1024],
  ["c", 2048],
]);
const orderedIds = ["a", "b", "c"];

function positionOf(id: string) {
  return positions.get(id) ?? null;
}

describe("positionForDrop", () => {
  it("places a row between the neighbors", () => {
    expect(positionForDrop(orderedIds, positionOf, "c", "b")).toBe(512);
  });

  it("places a row before the first item", () => {
    expect(positionForDrop(orderedIds, positionOf, "c", "a")).toBe(-1024);
  });

  it("places a row after the last item", () => {
    expect(positionForDrop(orderedIds, positionOf, "a", null)).toBe(3072);
  });

  it("skips a drop that leaves the row where it is", () => {
    expect(positionForDrop(orderedIds, positionOf, "a", "b")).toBeNull();
    expect(positionForDrop(orderedIds, positionOf, "c", null)).toBeNull();
    expect(positionForDrop(orderedIds, positionOf, "a", "a")).toBeNull();
  });

  it("appends a row that is not in the list", () => {
    expect(positionForDrop(orderedIds, positionOf, "x", null)).toBe(3072);
    expect(positionForDrop([], positionOf, "x", null)).toBe(0);
  });

  it("rejects an unknown neighbor", () => {
    expect(positionForDrop(orderedIds, positionOf, "a", "missing")).toBeNull();
  });
});
