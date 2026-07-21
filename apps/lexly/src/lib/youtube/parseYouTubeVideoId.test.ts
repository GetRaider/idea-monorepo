import { describe, expect, it } from "vitest";

import { parseYouTubeVideoId } from "@/lib/youtube/parseYouTubeVideoId";

describe("parseYouTubeVideoId", () => {
  it("parses youtube.com/watch?v=", () => {
    expect(
      parseYouTubeVideoId("https://www.youtube.com/watch?v=qz0aGYrrlhU"),
    ).toBe("qz0aGYrrlhU");
  });

  it("parses youtu.be/", () => {
    expect(parseYouTubeVideoId("https://youtu.be/qz0aGYrrlhU")).toBe(
      "qz0aGYrrlhU",
    );
  });

  it("accepts bare 11-char id", () => {
    expect(parseYouTubeVideoId("qz0aGYrrlhU")).toBe("qz0aGYrrlhU");
  });

  it("returns null for invalid input", () => {
    expect(parseYouTubeVideoId("invalid")).toBeNull();
  });
});

