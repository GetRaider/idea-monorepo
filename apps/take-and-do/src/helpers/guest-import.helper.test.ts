import { describe, expect, it } from "vitest";

import { guestStoreHasImportableData } from "./guest-import.helper";
import type { GuestStore } from "@/stores/guest/types";

function emptyStore(): GuestStore {
  return {
    tasks: [],
    folders: [],
    taskBoards: [],
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  };
}

describe("guestStoreHasImportableData", () => {
  it("returns false for null or empty store", () => {
    expect(guestStoreHasImportableData(null)).toBe(false);
    expect(guestStoreHasImportableData(emptyStore())).toBe(false);
  });

  it("returns true when folders, boards, or tasks exist", () => {
    expect(
      guestStoreHasImportableData({
        ...emptyStore(),
        folders: [
          {
            id: "folder-1",
            name: "Work",
            emoji: null,
            isPublic: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }),
    ).toBe(true);
  });
});
