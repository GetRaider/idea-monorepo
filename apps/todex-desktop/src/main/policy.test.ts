import { describe, expect, it } from "vitest";

import {
  decideNavigation,
  isGoogleSignInUrl,
  isStackRetry,
  isStatusDocument,
} from "./policy";

const allowedOrigins = ["http://localhost:3002", "http://localhost:8091"];
const statusPageUrl = "file:///Applications/Todex/stack-down.html";

describe("navigation policy", () => {
  it("allows the configured web and API origins, including paths and queries", () => {
    expect(
      decideNavigation(
        "http://localhost:3002/planning?view=board",
        allowedOrigins,
      ),
    ).toBe("allow");
    expect(
      decideNavigation("http://localhost:8091/health", allowedOrigins),
    ).toBe("allow");
  });

  it("sends Google sign-in to the system browser", () => {
    const url = "https://accounts.google.com/o/oauth2/v2/auth?client_id=todex";
    expect(isGoogleSignInUrl(url)).toBe(true);
    expect(decideNavigation(url, allowedOrigins)).toBe("external");
    expect(
      isGoogleSignInUrl("https://accounts.youtube.com/accounts/CheckCookie"),
    ).toBe(true);
    expect(isGoogleSignInUrl("https://mail.google.com/")).toBe(false);
    expect(isGoogleSignInUrl("https://accounts.google.com.evil.test/")).toBe(
      false,
    );
    expect(isGoogleSignInUrl("http://accounts.google.com/")).toBe(false);
    expect(isGoogleSignInUrl("https://user:secret@accounts.google.com/")).toBe(
      false,
    );
  });

  it("opens other https URLs externally and denies everything else", () => {
    expect(decideNavigation("https://localhost:3002/", allowedOrigins)).toBe(
      "external",
    );
    for (const url of [
      "http://evil.test/sign-in",
      "http://localhost:3002.evil.test/",
      "http://127.0.0.1:3002/",
      "javascript:alert(1)",
      "file:///etc/passwd",
      "about:blank",
      "mailto:dev@todex.test",
      "https://user:secret@accounts.google.com/",
      "not a url",
    ]) {
      expect(decideNavigation(url, allowedOrigins)).toBe("deny");
    }
  });

  it("recognizes a retry on the local status page only", () => {
    expect(isStackRetry(`${statusPageUrl}?retry=1`, statusPageUrl)).toBe(true);
    expect(isStatusDocument(`${statusPageUrl}?failed=api`, statusPageUrl)).toBe(
      true,
    );
    expect(
      isStackRetry(
        "http://localhost:3002/stack-down.html?retry=1",
        statusPageUrl,
      ),
    ).toBe(false);
    expect(isStackRetry(`${statusPageUrl}?retry=0`, statusPageUrl)).toBe(false);
  });
});
