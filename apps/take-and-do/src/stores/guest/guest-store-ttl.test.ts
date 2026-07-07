import { describe, expect, it } from "vitest";

import { GUEST_STORE_TTL_MS } from "@/constants/guest-features.constant";

import { guestStoreExpiresAtFromNow, isGuestStoreExpired } from "./index";

describe("guest store TTL", () => {
  it("expires at is seven days from the reference time", () => {
    const nowMs = Date.parse("2026-01-01T00:00:00.000Z");
    expect(guestStoreExpiresAtFromNow(nowMs)).toBe(
      new Date(nowMs + GUEST_STORE_TTL_MS).toISOString(),
    );
  });

  it("treats past expiry as expired", () => {
    const nowMs = Date.parse("2026-01-08T00:00:00.000Z");
    const expiresAt = guestStoreExpiresAtFromNow(
      nowMs - GUEST_STORE_TTL_MS - 1,
    );
    expect(isGuestStoreExpired(expiresAt, nowMs)).toBe(true);
  });

  it("treats future expiry as valid", () => {
    const nowMs = Date.parse("2026-01-01T00:00:00.000Z");
    const expiresAt = guestStoreExpiresAtFromNow(nowMs);
    expect(isGuestStoreExpired(expiresAt, nowMs)).toBe(false);
  });
});
