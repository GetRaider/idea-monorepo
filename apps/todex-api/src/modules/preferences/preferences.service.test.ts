import { describe, expect, it } from "vitest";
import { UpdateUserPreferencesBodySchema } from "@repo/api/todex";
import type { UserPreferences } from "@repo/api/todex";

import { PreferencesService } from "./preferences.service";

describe("PreferencesService", () => {
  it("reads a missing row as every module hidden", async () => {
    const service = new PreferencesService(fakeDatabase() as never);

    await expect(service.get("user-1")).resolves.toEqual({
      calendarEnabled: false,
      countersEnabled: false,
    });
  });

  it("changes only the setting it is sent", async () => {
    const service = new PreferencesService(fakeDatabase() as never);

    await expect(
      service.update("user-1", { countersEnabled: true }),
    ).resolves.toEqual({ calendarEnabled: false, countersEnabled: true });
    await expect(
      service.update("user-1", { calendarEnabled: true }),
    ).resolves.toEqual({ calendarEnabled: true, countersEnabled: true });
    await expect(
      service.update("user-1", { countersEnabled: false }),
    ).resolves.toEqual({ calendarEnabled: true, countersEnabled: false });
    await expect(service.get("user-1")).resolves.toEqual({
      calendarEnabled: true,
      countersEnabled: false,
    });
  });

  it("rejects an update that changes nothing", () => {
    expect(UpdateUserPreferencesBodySchema.safeParse({}).success).toBe(false);
  });
});

/** One preferences row with the column defaults and upsert of Postgres. */
function fakeDatabase() {
  let row: UserPreferences | undefined;
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (row ? [row] : []),
        }),
      }),
    }),
    insert: () => ({
      values: (values: Partial<UserPreferences>) => ({
        onConflictDoUpdate: ({ set }: { set: Partial<UserPreferences> }) => ({
          returning: async () => {
            row = row
              ? { ...row, ...set }
              : { calendarEnabled: false, countersEnabled: false, ...values };
            return [row];
          },
        }),
      }),
    }),
  };
}
