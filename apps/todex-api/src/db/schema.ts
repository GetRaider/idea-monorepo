import {
  DocMentionTarget,
  DocType,
  type DocBody,
  type DocPlainText,
  type TaskRecurrence,
} from "@repo/api/todex";
import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { users } from "./auth-schema";

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
  "cancelled",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const folderKindEnum = pgEnum("folder_kind", ["tasks", "docs"]);

export const docTypeEnum = pgEnum("doc_type", [DocType.COMMON, DocType.GOAL]);

export const docMentionTargetEnum = pgEnum("doc_mention_target", [
  DocMentionTarget.TASK,
  DocMentionTarget.DOC,
  DocMentionTarget.EVENT,
]);

export const workspaceMemberRoleEnum = pgEnum("workspace_member_role", [
  "owner",
  "member",
]);

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  taskSeq: integer("task_seq").notNull().default(0),
  docSeq: integer("doc_seq").notNull().default(0),
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

export const docs = pgTable(
  "docs",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => folders.id, {
      onDelete: "set null",
    }),
    type: docTypeEnum("type").notNull(),
    docKey: text("doc_key").notNull(),
    title: text("title").notNull(),
    body: jsonb("body").$type<DocBody>().notNull(),
    plainText: jsonb("plain_text").$type<DocPlainText>().notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("docs_workspace_doc_key_unique").on(
      table.workspaceId,
      table.docKey,
    ),
    index("docs_workspace_id_idx").on(table.workspaceId),
    index("docs_folder_id_idx").on(table.folderId),
  ],
);

export const docTasks = pgTable(
  "doc_tasks",
  {
    docId: text("doc_id")
      .notNull()
      .references(() => docs.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.docId, table.taskId] }),
    index("doc_tasks_task_id_idx").on(table.taskId),
  ],
);

export const docMentions = pgTable(
  "doc_mentions",
  {
    docId: text("doc_id")
      .notNull()
      .references(() => docs.id, { onDelete: "cascade" }),
    targetType: docMentionTargetEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.docId, table.targetType, table.targetId],
    }),
    index("doc_mentions_target_idx").on(table.targetType, table.targetId),
  ],
);

export type WorkspaceRow = typeof workspaces.$inferSelect;
export type WorkspaceMemberRow = typeof workspaceMembers.$inferSelect;
export type FolderRow = typeof folders.$inferSelect;
export type TaskBoardRow = typeof taskBoards.$inferSelect;
export type BoardAreaRow = typeof boardAreas.$inferSelect;
export type BoardProgressStageRow = typeof boardProgressStages.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type DocRow = typeof docs.$inferSelect;

interface TaskAcceptanceCriterion {
  id: string;
  text: string;
  done: boolean;
}
