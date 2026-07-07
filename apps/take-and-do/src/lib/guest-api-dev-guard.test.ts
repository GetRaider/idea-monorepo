import { afterEach, describe, expect, it, vi } from "vitest";

import { Route } from "@/constants/route.constant";

import {
  assertGuestApiAccessAllowed,
  setGuestSessionActive,
} from "./guest-api-dev-guard";

describe("guest-api-dev-guard", () => {
  afterEach(() => {
    setGuestSessionActive(false);
    vi.unstubAllEnvs();
  });

  it("allows workspace routes for registered sessions", () => {
    vi.stubEnv("NODE_ENV", "development");
    setGuestSessionActive(false);

    expect(() => assertGuestApiAccessAllowed(Route.TASKS)).not.toThrow();
  });

  it("blocks workspace routes for guest sessions in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    setGuestSessionActive(true);

    expect(() => assertGuestApiAccessAllowed(Route.TASKS)).toThrow(
      /registered-only API route/,
    );
  });

  it("does not block in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    setGuestSessionActive(true);

    expect(() => assertGuestApiAccessAllowed(Route.TASKS)).not.toThrow();
  });
});
