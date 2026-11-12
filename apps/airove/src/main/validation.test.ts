import { describe, expect, it } from "vitest";

import {
  nullableId,
  validId,
  validProvider,
  validateCommand,
} from "./validation";

describe("metadata IPC input validation", () => {
  it("rejects malformed payloads, unsupported operations and invalid names", () => {
    for (const input of [
      null,
      [],
      {},
      { type: "sql:run" },
      { type: "folder:create", name: " " },
      { type: "space:create", name: "Space" },
      { type: "folder:create", name: "x".repeat(241) },
      { type: "chat:rename", id: "id", name: "line\nbreak" },
    ])
      expect(() => validateCommand(input)).toThrow();
    for (const input of [1, "../file", "", { id: "id" }])
      expect(() => validId(input)).toThrow();
    expect(() => validProvider("other")).toThrow();
    expect(() => nullableId(undefined)).toThrow();
  });
  it("trims names and passes only known fields to the main process operation", () => {
    expect(
      validateCommand({
        type: "folder:create",
        name: "  Project  ",
        url: "https://evil.test",
      }),
    ).toEqual({ type: "folder:create", name: "Project" });
    expect(nullableId(null)).toBeNull();
  });
});
