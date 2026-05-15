import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth.schema";

export const calendarEventTypeEnum = pgEnum("calendar_event_type", [
  "common",
  "timeBlock",
]);

export const calendarEventsTable = pgTable("calendar_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: calendarEventTypeEnum("type").notNull(),
  title: text("title").notNull(),
  start: timestamp("start").notNull(),
  end: timestamp("end").notNull(),
  allDay: boolean("all_day").notNull().default(false),
  color: text("color"),
  extra: jsonb("extra"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
