import { describe, expect, it } from "vitest";

import { assertDevLoginConfig } from "./env";

describe("assertDevLoginConfig", () => {
  it("allows dev login to stay off without a password", () => {
    expect(() => assertDevLoginConfig({ NODE_ENV: "production" })).not.toThrow();
  });

  it("rejects dev login in production", () => {
    expect(() =>
      assertDevLoginConfig({
        NODE_ENV: "production",
        TODEX_DEV_LOGIN: true,
        TODEX_DEV_PASSWORD: "long-enough",
      }),
    ).toThrow(/production/);
  });

  it("requires a password of at least 8 characters", () => {
    expect(() =>
      assertDevLoginConfig({ NODE_ENV: "development", TODEX_DEV_LOGIN: true, TODEX_DEV_PASSWORD: "short" }),
    ).toThrow(/TODEX_DEV_PASSWORD/);
  });

  it("accepts dev login in development with a password", () => {
    expect(() =>
      assertDevLoginConfig({
        NODE_ENV: "development",
        TODEX_DEV_LOGIN: true,
        TODEX_DEV_PASSWORD: "long-enough",
      }),
    ).not.toThrow();
  });
});
