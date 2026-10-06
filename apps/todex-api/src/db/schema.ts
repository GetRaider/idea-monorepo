import type { TaskRecurrence } from "@repo/api/todex";
import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./auth-schema";

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const folderKindEnum = pgEnum("folder_kind", ["tasks", "docs"]);

export const workspaceMemberRoleEnum = pgEnum("workspace_member_role", [
  "owner",
  "member",
]);

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  taskSeq: integer("task_seq").notNull().default(0),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: workspaceMemberRoleEnum("role").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("workspace_members_user_id_unique").on(table.userId),
    uniqueIndex("workspace_members_workspace_user_unique").on(
      table.workspaceId,
      table.userId,
    ),
  ],
);

export const folders = pgTable("folders", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  kind: folderKindEnum("kind").notNull(),
  name: text("name").notNull(),
  emoji: text("emoji"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const taskBoards = pgTable("task_boards", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  folderId: text("folder_id").references(() => folders.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  emoji: text("emoji"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const boardAreas = pgTable(
  "board_areas",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => taskBoards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("board_areas_board_position_unique").on(
      table.boardId,
      table.position,
    ),
    uniqueIndex("board_areas_board_name_unique").on(
      table.boardId,
      sql`lower(${table.name})`,
    ),
    uniqueIndex("board_areas_default_unique")
      .on(table.boardId)
      .where(sql`${table.isDefault} = true`),
  ],
);

export const boardProgressStages = pgTable(
  "board_progress_stages",
  {
    id: text("id").primaryKey(),
    boardId: text("board_id")
      .notNull()
      .references(() => taskBoards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("board_progress_stages_board_position_unique").on(
      table.boardId,
      table.position,
    ),
    uniqueIndex("board_progress_stages_board_name_unique").on(
      table.boardId,
      sql`lower(${table.name})`,
    ),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    taskBoardId: text("task_board_id")
      .notNull()
      .references(() => taskBoards.id, { onDelete: "cascade" }),
    taskKey: text("task_key").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull().default(""),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    dueDate: timestamp("due_date"),
    scheduleDate: timestamp("schedule_date"),
    estimation: integer("estimation"),
    acceptanceCriteria: jsonb("acceptance_criteria")
      .$type<TaskAcceptanceCriterion[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    recurrence: jsonb("recurrence").$type<TaskRecurrence | null>(),
    areaId: text("area_id")
      .notNull()
      .references(() => boardAreas.id, { onDelete: "restrict" }),
    progressStageId: text("progress_stage_id").references(
      () => boardProgressStages.id,
      { onDelete: "set null" },
    ),
    parentTaskId: text("parent_task_id"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("tasks_workspace_task_key_unique").on(
      table.workspaceId,
      table.taskKey,
    ),
    index("tasks_area_id_idx").on(table.areaId),
    index("tasks_progress_stage_id_idx").on(table.progressStageId),
    foreignKey({
      columns: [table.parentTaskId],
      foreignColumns: [table.id],
    }).onDelete("cascade"),
  ],
);

export type WorkspaceRow = typeof workspaces.$inferSelect;
export type WorkspaceMemberRow = typeof workspaceMembers.$inferSelect;
export type FolderRow = typeof folders.$inferSelect;
export type TaskBoardRow = typeof taskBoards.$inferSelect;
export type BoardAreaRow = typeof boardAreas.$inferSelect;
export type BoardProgressStageRow = typeof boardProgressStages.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;

interface TaskAcceptanceCriterion {
  id: string;
  text: string;
  done: boolean;
}
