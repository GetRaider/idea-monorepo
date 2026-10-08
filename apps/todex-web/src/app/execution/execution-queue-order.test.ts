import { describe, expect, it } from "vitest";

import { moveQueueItem } from "./execution-queue-order";

describe("moveQueueItem", () => {
  it("moves a task earlier in the queue", () => {
    expect(moveQueueItem(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
  });

  it("moves a task later in the queue", () => {
    expect(moveQueueItem(["a", "b", "c"], "a", "c")).toEqual(["b", "c", "a"]);
  });

  it("leaves the queue alone when the drop target is the same task", () => {
    expect(moveQueueItem(["a", "b"], "a", "a")).toEqual(["a", "b"]);
  });
});
