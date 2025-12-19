import {
  pgTable,
  text,
  timestamp,
  doublePrecision,
  pgEnum,
} from "drizzle-orm/pg-core";
import { taskBoards } from "../taskBoard/taskBoard.schema";

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

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  taskBoardId: text("task_board_id")
    .notNull()
    .references(() => taskBoards.id, { onDelete: "cascade" }),
  taskKey: text("task_key"),
  summary: text("summary").notNull(),
  description: text("description").notNull().default(""),
  status: taskStatusEnum("status").notNull().default("To Do"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  dueDate: timestamp("due_date"),
  estimation: doublePrecision("estimation"),
  schedule: text("schedule"), // "today" | "tomorrow" | null
  scheduleDate: timestamp("schedule_date"),
  parentTaskId: text("parent_task_id").references(() => tasks.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

