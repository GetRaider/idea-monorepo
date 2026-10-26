import { describe, expect, it } from "vitest";

import {
  applyTaskSelection,
  isToggleClick,
  selectionForContextTarget,
} from "./task-selection";

const orderedIds = ["a", "b", "c", "d", "e"];

describe("applyTaskSelection", () => {
  it("replaces the selection on a plain click", () => {
    const next = applyTaskSelection({
      selectedIds: new Set(["a", "b"]),
      anchorId: "a",
      taskId: "d",
      orderedIds,
      shift: false,
      toggle: false,
    });
    expect([...next.selectedIds]).toEqual(["d"]);
    expect(next.anchorId).toBe("d");
  });

  it("toggles one task without clearing the rest", () => {
    const added = applyTaskSelection({
      selectedIds: new Set(["a"]),
      anchorId: "a",
      taskId: "c",
      orderedIds,
      shift: false,
      toggle: true,
    });
    expect([...added.selectedIds]).toEqual(["a", "c"]);
    expect(added.anchorId).toBe("c");

    const removed = applyTaskSelection({
      selectedIds: added.selectedIds,
      anchorId: added.anchorId,
      taskId: "a",
      orderedIds,
      shift: false,
      toggle: true,
    });
    expect([...removed.selectedIds]).toEqual(["c"]);
  });

  it("selects the inclusive range and keeps the anchor", () => {
    const next = applyTaskSelection({
      selectedIds: new Set(["b"]),
      anchorId: "b",
      taskId: "e",
      orderedIds,
      shift: true,
      toggle: false,
    });
    expect([...next.selectedIds]).toEqual(["b", "c", "d", "e"]);
    expect(next.anchorId).toBe("b");
  });

  it("adds a range when shift and toggle are both held", () => {
    const next = applyTaskSelection({
      selectedIds: new Set(["a"]),
      anchorId: "c",
      taskId: "e",
      orderedIds,
      shift: true,
      toggle: true,
    });
    expect([...next.selectedIds]).toEqual(["a", "c", "d", "e"]);
    expect(next.anchorId).toBe("c");
  });

  it("selects only the clicked task when the anchor is not visible", () => {
    const next = applyTaskSelection({
      selectedIds: new Set(["a"]),
      anchorId: "missing",
      taskId: "c",
      orderedIds,
      shift: true,
      toggle: false,
    });
    expect([...next.selectedIds]).toEqual(["c"]);
    expect(next.anchorId).toBe("c");
  });
});

describe("isToggleClick", () => {
  it("uses Command on macOS and Control on other platforms", () => {
    expect(isToggleClick({ metaKey: true, ctrlKey: false }, "MacIntel")).toBe(
      true,
    );
    expect(isToggleClick({ metaKey: false, ctrlKey: true }, "MacIntel")).toBe(
      false,
    );
    expect(isToggleClick({ metaKey: false, ctrlKey: true }, "Win32")).toBe(
      true,
    );
  });
});

describe("selectionForContextTarget", () => {
  it("keeps the selection when the target is already in it", () => {
    const selectedIds = new Set(["a", "b"]);
    expect(selectionForContextTarget(selectedIds, "b")).toBe(selectedIds);
  });

  it("replaces the selection when the target is outside it", () => {
    expect([...selectionForContextTarget(new Set(["a", "b"]), "c")]).toEqual([
      "c",
    ]);
  });
});
