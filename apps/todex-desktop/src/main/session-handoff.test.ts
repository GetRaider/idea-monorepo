import { describe, expect, it } from "vitest";

import { readSessionHandoff } from "./session-handoff";

describe("browser sign-in handoff", () => {
  it("reads the session token from the loopback callback", () => {
    expect(
      readSessionHandoff("/callback?state=abc&session=token.signature"),
    ).toEqual({ state: "abc", session: "token.signature" });
  });

  it("rejects anything that is not a completed handoff", () => {
    expect(readSessionHandoff("/callback?state=abc")).toBeNull();
    expect(readSessionHandoff("/other?state=abc&session=token")).toBeNull();
    expect(readSessionHandoff("not a url")).toBeNull();
  });
});
