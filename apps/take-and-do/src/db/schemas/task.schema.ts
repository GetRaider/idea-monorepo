import {
  boolean,
  pgTable,
  text,
  timestamp,
  doublePrecision,
  pgEnum,
  foreignKey,
} from "drizzle-orm/pg-core";

import { user } from "./auth.schema";
import { taskBoardsTable } from "./taskBoard.schema";

export const taskStatusEnum = pgEnum("task_status", [
  "To Do",
  "In Progress",
  "Done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    isPublic: boolean("is_public").notNull().default(false),
    taskBoardId: text("task_board_id")
      .notNull()
      .references(() => taskBoardsTable.id, { onDelete: "cascade" }),
    taskKey: text("task_key"),
    summary: text("summary").notNull(),
    description: text("description").notNull().default(""),
    status: taskStatusEnum("status").notNull().default("To Do"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    dueDate: timestamp("due_date"),
    estimation: doublePrecision("estimation"),
    scheduleDate: timestamp("schedule_date"),
    parentTaskId: text("parent_task_id"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (self) => [
    foreignKey({
      columns: [self.parentTaskId],
      foreignColumns: [self.id],
    }).onDelete("cascade"),
  ],
);
