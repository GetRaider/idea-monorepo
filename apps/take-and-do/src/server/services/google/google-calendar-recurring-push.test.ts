import { describe, expect, it } from "vitest";

import {
  buildTailSeriesBody,
  resolveFollowingMasterIdFromInstance,
} from "./google-calendar-recurring-push";
import {
  GOOGLE_SPLIT_GROUP_PROP,
  mergeGoogleSplitGroupMarker,
  readGoogleSplitGroupId,
} from "./google-calendar-split-lineage";

describe("google-calendar-split-lineage", () => {
  it("reads and merges split group markers", () => {
    expect(
      readGoogleSplitGroupId({
        extendedProperties: {
          shared: { [GOOGLE_SPLIT_GROUP_PROP]: "root123" },
        },
      }),
    ).toBe("root123");

    expect(
      mergeGoogleSplitGroupMarker({}, "root123").extendedProperties,
    ).toEqual({
      shared: { [GOOGLE_SPLIT_GROUP_PROP]: "root123" },
    });
  });
});

describe("resolveFollowingMasterIdFromInstance", () => {
  it("prefers recurringEventId from the clicked instance payload", () => {
    expect(
      resolveFollowingMasterIdFromInstance(
        { recurringEventId: "tailMaster" },
        "wrongMaster",
      ),
    ).toBe("tailMaster");
  });
});

describe("buildTailSeriesBody", () => {
  it("preserves iCalUID on the first split tail", () => {
    const body = buildTailSeriesBody(
      {
        summary: "Weekly",
        iCalUID: "abc@google.com",
        sequence: 2,
        colorId: "1",
        status: "confirmed",
      },
      {
        summary: "Weekly updated",
        start: { dateTime: "2025-06-17T10:00:00", timeZone: "UTC" },
        end: { dateTime: "2025-06-17T11:00:00", timeZone: "UTC" },
      },
      ["RRULE:FREQ=WEEKLY"],
      "root123",
    );

    expect(body.iCalUID).toBe("abc@google.com");
    expect(body.sequence).toBe(3);
    expect(body.summary).toBe("Weekly updated");
    expect(body).not.toHaveProperty("status");
    expect(
      (
        body.extendedProperties as {
          shared?: Record<string, string>;
        }
      ).shared?.[GOOGLE_SPLIT_GROUP_PROP],
    ).toBe("root123");
  });

  it("omits iCalUID on nested split tails", () => {
    const body = buildTailSeriesBody(
      {
        summary: "Weekly",
        iCalUID: "abc@google.com",
        extendedProperties: {
          shared: { [GOOGLE_SPLIT_GROUP_PROP]: "root123" },
        },
      },
      {
        summary: "Weekly updated",
        start: { dateTime: "2025-06-17T10:00:00", timeZone: "UTC" },
        end: { dateTime: "2025-06-17T11:00:00", timeZone: "UTC" },
      },
      ["RRULE:FREQ=WEEKLY"],
      "root123",
    );

    expect(body).not.toHaveProperty("iCalUID");
  });
});
