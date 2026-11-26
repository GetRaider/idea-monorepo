import { describe, expect, it } from "vitest";

import { readDesktopConfig } from "./config";

describe("desktop config", () => {
  it("uses the local Todex ports when the env is unset or blank", () => {
    expect(readDesktopConfig({})).toMatchObject({
      webUrl: "http://localhost:3002",
      apiUrl: "http://localhost:8091",
      allowedOrigins: ["http://localhost:3002", "http://localhost:8091"],
      targets: [
        { name: "api", url: "http://localhost:8091/health" },
        { name: "web", url: "http://localhost:3002/sign-in" },
      ],
    });
    expect(
      readDesktopConfig({ TODEX_WEB_URL: "  ", TODEX_API_URL: "" }).webUrl,
    ).toBe("http://localhost:3002");
  });

  it("keeps a base path and drops a trailing slash, query, and hash", () => {
    const config = readDesktopConfig({
      TODEX_WEB_URL: "https://todex.example/app/?next=1#sign-in",
      TODEX_API_URL: "https://api.example/",
    });
    expect(config.webUrl).toBe("https://todex.example/app");
    expect(config.apiUrl).toBe("https://api.example");
    expect(config.targets[1]?.url).toBe("https://todex.example/app/sign-in");
  });

  it("rejects non-http URLs and embedded credentials", () => {
    expect(() =>
      readDesktopConfig({ TODEX_WEB_URL: "file:///tmp/todex" }),
    ).toThrow(/TODEX_WEB_URL/);
    expect(() =>
      readDesktopConfig({
        TODEX_API_URL: "http://user:secret@localhost:8091",
      }),
    ).toThrow(/credentials/);
    expect(() => readDesktopConfig({ TODEX_WEB_URL: "not a url" })).toThrow(
      /absolute http/,
    );
  });
});
