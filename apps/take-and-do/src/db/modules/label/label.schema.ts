import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const labels = pgTable("labels", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
