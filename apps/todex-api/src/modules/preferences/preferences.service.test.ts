import { describe, expect, it } from "vitest";

import { PreferencesService } from "./preferences.service";

describe("PreferencesService", () => {
  it("reads a missing row as calendar disabled and upserts the flag", async () => {
    let row: { userId: string; calendarEnabled: boolean } | undefined;
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => (row ? [row] : []),
          }),
        }),
      }),
      insert: () => ({
        values: (values: { userId: string; calendarEnabled: boolean }) => ({
          onConflictDoUpdate: () => ({
            returning: async () => {
              row = values;
              return [row];
            },
          }),
        }),
      }),
    };
    const service = new PreferencesService(db as never);

    await expect(service.get("user-1")).resolves.toEqual({
      calendarEnabled: false,
    });
    await expect(
      service.update("user-1", { calendarEnabled: true }),
    ).resolves.toEqual({ calendarEnabled: true });
    await expect(service.get("user-1")).resolves.toEqual({
      calendarEnabled: true,
    });
    await expect(
      service.update("user-1", { calendarEnabled: false }),
    ).resolves.toEqual({ calendarEnabled: false });
    await expect(service.get("user-1")).resolves.toEqual({
      calendarEnabled: false,
    });
  });
});
