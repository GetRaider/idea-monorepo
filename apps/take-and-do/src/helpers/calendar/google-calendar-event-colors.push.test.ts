import { describe, expect, it } from "vitest";

import { mapPushBodyToGooglePatch } from "@/server/controllers/google-calendar/google-calendar-integration.mapper";

describe("mapPushBodyToGooglePatch colorId", () => {
  const baseBody = {
    id: "gcal:abc",
    type: "common" as const,
    title: "Test",
    start: "2025-06-01T10:00:00.000Z",
    end: "2025-06-01T11:00:00.000Z",
    allDay: false,
    timeZone: "UTC",
  };

  it("maps hex color to Google colorId", () => {
    const patch = mapPushBodyToGooglePatch({
      ...baseBody,
      color: "#d50000",
    });
    expect(patch.colorId).toBe("11");
  });

  it("clears colorId when color is null", () => {
    const patch = mapPushBodyToGooglePatch({
      ...baseBody,
      color: null,
    });
    expect(patch.colorId).toBeNull();
  });

  it("omits colorId when color is not in body", () => {
    const patch = mapPushBodyToGooglePatch(baseBody);
    expect(patch).not.toHaveProperty("colorId");
  });

  it("omits recurrence on update by default", () => {
    const patch = mapPushBodyToGooglePatch({
      ...baseBody,
      repeat: "weekly",
    });
    expect(patch).not.toHaveProperty("recurrence");
  });

  it("includes recurrence when explicitly requested", () => {
    const patch = mapPushBodyToGooglePatch(
      {
        ...baseBody,
        repeat: "weekly",
      },
      { includeRecurrence: true },
    );
    expect(patch.recurrence).toEqual(["RRULE:FREQ=WEEKLY"]);
  });
});
