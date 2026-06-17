import { describe, expect, it } from "vitest";

import tailwindConfig from "../../tailwind.config";

import { APP_CHROME_TITLE_ACTION_ROW } from "./app-chrome-layout";

describe("app-chrome-layout", () => {
  it("exposes title/action row spacing utilities used by page headers", () => {
    expect(APP_CHROME_TITLE_ACTION_ROW).toContain("sm:justify-between");
    expect(APP_CHROME_TITLE_ACTION_ROW).toContain("sm:items-center");
  });

  it("is scanned by Tailwind so responsive header layout classes are generated", () => {
    const contentGlobs = tailwindConfig.content as string[];

    expect(contentGlobs.some((glob) => glob.includes("src/helpers"))).toBe(
      true,
    );
  });
});
