import { describe, expect, it } from "vitest";

import { GUEST_FEATURES } from "@/constants/guest-features.constant";

import { resolveFeatureAccess } from "./resolve-feature-access";

describe("resolveFeatureAccess", () => {
  it("allows all features for registered users", () => {
    expect(resolveFeatureAccess({ isGuest: false }, "ai").allowed).toBe(true);
    expect(
      resolveFeatureAccess({ isGuest: false }, "googleCalendar").allowed,
    ).toBe(true);
  });

  it("denies AI for guest users", () => {
    const access = resolveFeatureAccess({ isGuest: true }, "ai");
    expect(access.allowed).toBe(false);
    if (!access.allowed) {
      expect(access.reason).toContain("AI");
    }
  });

  it("denies Google Calendar for guest users by default", () => {
    expect(GUEST_FEATURES.googleCalendar).toBe(false);
    expect(
      resolveFeatureAccess({ isGuest: true }, "googleCalendar").allowed,
    ).toBe(false);
  });

  it("allows enabled guest features", () => {
    expect(resolveFeatureAccess({ isGuest: true }, "workspace").allowed).toBe(
      true,
    );
    expect(resolveFeatureAccess({ isGuest: true }, "focus").allowed).toBe(true);
  });
});
