import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/auth.schema";

export const foldersTable = pgTable("folders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isPublic: boolean("is_public").notNull().default(false),
  name: text("name").notNull(),
  emoji: text("emoji"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
