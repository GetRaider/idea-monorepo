import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";
import { foldersTable } from "./folder.schema";

export const taskBoardsTable = pgTable("task_boards", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isPublic: boolean("is_public").notNull().default(false),
  name: text("name").notNull(),
  emoji: text("emoji"),
  folderId: text("folder_id").references(() => foldersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
