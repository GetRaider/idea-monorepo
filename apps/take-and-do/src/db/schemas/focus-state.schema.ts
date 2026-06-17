import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";

export const focusStateTable = pgTable("focus_state", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  sessions: jsonb("sessions").notNull().default([]),
  backlog: jsonb("backlog").notNull().default([]),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
