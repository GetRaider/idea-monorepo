import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { folders } from "../folder/folder.schema";

export const taskBoards = pgTable("task_boards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  folderId: text("folder_id").references(() => folders.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
