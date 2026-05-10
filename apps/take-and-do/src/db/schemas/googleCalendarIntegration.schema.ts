import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";

export const googleCalendarIntegration = pgTable(
  "google_calendar_integration",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    calendarId: text("calendar_id").notNull().default("primary"),
    syncToken: text("sync_token"),
    lastSyncAt: timestamp("last_sync_at"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
);
