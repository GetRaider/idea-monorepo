import {
  pgTable,
  text,
  timestamp,
  doublePrecision,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const folders = pgTable("folders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

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

export const labels = pgTable("labels", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const taskLabels = pgTable("task_labels", {
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  labelId: text("label_id")
    .notNull()
    .references(() => labels.id, { onDelete: "cascade" }),
});

// Relations
export const foldersRelations = relations(folders, ({ many }) => ({
  taskBoards: many(taskBoards),
}));

export const taskBoardsRelations = relations(taskBoards, ({ one, many }) => ({
  folder: one(folders, {
    fields: [taskBoards.folderId],
    references: [folders.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  taskBoard: one(taskBoards, {
    fields: [tasks.taskBoardId],
    references: [taskBoards.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  subtasks: many(tasks, {
    relationName: "subtasks",
  }),
  taskLabels: many(taskLabels),
}));

export const labelsRelations = relations(labels, ({ many }) => ({
  taskLabels: many(taskLabels),
}));

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLabels.taskId],
    references: [tasks.id],
  }),
  label: one(labels, {
    fields: [taskLabels.labelId],
    references: [labels.id],
  }),
}));



