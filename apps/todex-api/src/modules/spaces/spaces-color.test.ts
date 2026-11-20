import { describe, expect, it } from "vitest";
import {
  CreateSpaceBodySchema,
  DEFAULT_SPACE_COLOR,
  SpaceColorSchema,
} from "@repo/api/todex";

describe("space color", () => {
  it("accepts only the preset palette", () => {
    expect(SpaceColorSchema.parse(DEFAULT_SPACE_COLOR)).toBe("#B8A4D1");
    expect(SpaceColorSchema.safeParse("#ffffff").success).toBe(false);
  });

  it("leaves color optional so create can apply the default", () => {
    expect(CreateSpaceBodySchema.parse({ name: "Studio" }).color).toBeUndefined();
    expect(DEFAULT_SPACE_COLOR).toBe("#B8A4D1");
  });
});
