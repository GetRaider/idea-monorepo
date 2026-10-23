import { describe, expect, it } from "vitest";

import { toolAllowKey } from "./tool-allow-key";

describe("toolAllowKey", () => {
  it("treats the same arguments in a different key order as one request", () => {
    const left = toolAllowKey("create_doc", { title: "Notes", type: "common" });
    const right = toolAllowKey("create_doc", { type: "common", title: "Notes" });
    expect(left).toBe(right);
  });

  it("keeps a different title as a different request", () => {
    expect(toolAllowKey("create_doc", { title: "Notes" })).not.toBe(
      toolAllowKey("create_doc", { title: "Other" }),
    );
  });
});
