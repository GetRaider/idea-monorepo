import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { rendererAssetPath } from "./renderer-assets";

describe("secure local renderer assets", () => {
  const root = resolve("/app/renderer");
  it("resolves only assets in the renderer directory", () => {
    expect(rendererAssetPath("airove://app/index.html", root)).toBe(
      resolve(root, "index.html"),
    );
    expect(rendererAssetPath("airove://app/assets/model.wasm", root)).toBe(
      resolve(root, "assets/model.wasm"),
    );
  });
  it("rejects other hosts, protocols, encoded traversal and malformed paths", () => {
    for (const url of [
      "https://app/index.html",
      "airove://other/index.html",
      "airove://user:password@app/index.html",
      "airove://app/..%2f..%2fsecret",
      "airove://app/%00",
      "airove://app/%broken",
    ])
      expect(rendererAssetPath(url, root)).toBeNull();
  });
});
