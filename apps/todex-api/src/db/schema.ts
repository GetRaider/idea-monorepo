import {
  DocMentionTarget,
  DocType,
  type CalendarRsvpStatus,
  type DocBody,
  type DocPlainText,
  type ExecutionInterval,
  type TaskRecurrence,
} from "@repo/api/todex";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
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
  vector,
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

export const spaces = pgTable("spaces", {
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

export const spaceSections = pgTable(
  "space_sections",
  {
    id: text("id").primaryKey(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
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
    uniqueIndex("space_sections_space_position_unique").on(
      table.spaceId,
      table.position,
    ),
    uniqueIndex("space_sections_space_name_unique").on(
      table.spaceId,
      sql`lower(${table.name})`,
    ),
    uniqueIndex("space_sections_default_unique")
      .on(table.spaceId)
      .where(sql`${table.isDefault} = true`),
  ],
);

export const spaceProgressStages = pgTable(
  "space_progress_stages",
  {
    id: text("id").primaryKey(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
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
    uniqueIndex("space_progress_stages_space_position_unique").on(
      table.spaceId,
      table.position,
    ),
    uniqueIndex("space_progress_stages_space_name_unique").on(
      table.spaceId,
      sql`lower(${table.name})`,
    ),
  ],
);

export const epics = pgTable(
  "epics",
  {
    id: text("id").primaryKey(),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    sectionId: text("section_id")
      .notNull()
      .references(() => spaceSections.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("epics_space_name_unique").on(
      table.spaceId,
      sql`lower(${table.name})`,
    ),
    index("epics_space_id_idx").on(table.spaceId),
    index("epics_section_id_idx").on(table.sectionId),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    spaceId: text("space_id")
      .notNull()
      .references(() => spaces.id, { onDelete: "cascade" }),
    taskKey: text("task_key").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull().default(""),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    dueDate: timestamp("due_date"),
    scheduleDate: timestamp("schedule_date"),
    estimation: integer("estimation").notNull(),
    color: text("color"),
    acceptanceCriteria: jsonb("acceptance_criteria")
      .$type<TaskAcceptanceCriterion[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    recurrence: jsonb("recurrence").$type<TaskRecurrence | null>(),
    sectionId: text("section_id")
      .notNull()
      .references(() => spaceSections.id, { onDelete: "restrict" }),
    progressStageId: text("progress_stage_id").references(
      () => spaceProgressStages.id,
      { onDelete: "set null" },
    ),
    epicId: text("epic_id").references(() => epics.id, {
      onDelete: "set null",
    }),
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
    index("tasks_section_id_idx").on(table.sectionId),
    index("tasks_epic_id_idx").on(table.epicId),
    index("tasks_progress_stage_id_idx").on(table.progressStageId),
    foreignKey({
      columns: [table.parentTaskId],
      foreignColumns: [table.id],
    }).onDelete("cascade"),
    check("tasks_estimation_positive", sql`${table.estimation} > 0`),
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
export type SpaceRow = typeof spaces.$inferSelect;
export type SpaceSectionRow = typeof spaceSections.$inferSelect;
export type SpaceProgressStageRow = typeof spaceProgressStages.$inferSelect;
export type EpicRow = typeof epics.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export const calendarRsvpStatusEnum = pgEnum("calendar_rsvp_status", [
  "yes",
  "no",
  "maybe",
]);

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    seriesEventId: text("series_event_id"),
    title: text("title").notNull(),
    start: timestamp("start").notNull(),
    end: timestamp("end").notNull(),
    allDay: boolean("all_day").notNull().default(false),
    color: text("color"),
    timeZone: text("time_zone").notNull(),
    recurrence: jsonb("recurrence").$type<TaskRecurrence | null>(),
    rawRrule: text("raw_rrule"),
    description: text("description").notNull().default(""),
    taskScope: jsonb("task_scope")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    participants: jsonb("participants")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    rsvpStatus: calendarRsvpStatusEnum("rsvp_status"),
    googleEventId: text("google_event_id"),
    googleEtag: text("google_etag"),
    googleUpdatedAt: timestamp("google_updated_at"),
    organizerSelf: boolean("organizer_self").notNull().default(true),
    originalStart: timestamp("original_start"),
    cancelled: boolean("cancelled").notNull().default(false),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("calendar_events_workspace_start_idx").on(
      table.workspaceId,
      table.start,
    ),
    index("calendar_events_series_event_id_idx").on(table.seriesEventId),
    uniqueIndex("calendar_events_workspace_google_event_unique")
      .on(table.workspaceId, table.googleEventId)
      .where(sql`${table.googleEventId} is not null`),
    foreignKey({
      columns: [table.seriesEventId],
      foreignColumns: [table.id],
    }).onDelete("cascade"),
  ],
);

export const calendarEventTemplates = pgTable("calendar_event_templates", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  color: text("color"),
  description: text("description").notNull().default(""),
  taskScope: jsonb("task_scope")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const googleCalendarIntegrations = pgTable(
  "google_calendar_integrations",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    calendarId: text("calendar_id").notNull().default("primary"),
    syncToken: text("sync_token"),
    lastSyncAt: timestamp("last_sync_at"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
);

export const executionExecutorTypeEnum = pgEnum("execution_executor_type", [
  "human",
  "ai",
]);

export const executionResultOutcomeEnum = pgEnum("execution_result_outcome", [
  "implemented",
  "blocked",
  "partial",
]);

export const executionSessions = pgTable(
  "execution_sessions",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").notNull(),
    endedAt: timestamp("ended_at"),
    duration: integer("duration"),
    executorType: executionExecutorTypeEnum("executor_type")
      .notNull()
      .default("human"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("execution_sessions_open_workspace_unique")
      .on(table.workspaceId)
      .where(sql`${table.endedAt} is null`),
    index("execution_sessions_workspace_started_idx").on(
      table.workspaceId,
      table.startedAt,
    ),
  ],
);

export const executionSessionTasks = pgTable(
  "execution_session_tasks",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => executionSessions.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    active: boolean("active").notNull().default(true),
    intervals: jsonb("intervals")
      .$type<ExecutionInterval[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
  },
  (table) => [
    uniqueIndex("execution_session_tasks_session_task_unique").on(
      table.sessionId,
      table.taskId,
    ),
    index("execution_session_tasks_task_id_idx").on(table.taskId),
  ],
);

export const taskExecutionResults = pgTable(
  "task_execution_results",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    summary: text("summary").notNull(),
    outcome: executionResultOutcomeEnum("outcome").notNull(),
    artifactUrls: jsonb("artifact_urls")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    decisions: text("decisions").notNull().default(""),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("task_execution_results_workspace_task_created_idx").on(
      table.workspaceId,
      table.taskId,
      table.createdAt,
    ),
  ],
);

export const executionCurrent = pgTable("execution_current", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const executionQueue = pgTable(
  "execution_queue",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("execution_queue_workspace_task_unique").on(
      table.workspaceId,
      table.taskId,
    ),
    index("execution_queue_workspace_position_idx").on(
      table.workspaceId,
      table.position,
    ),
  ],
);

export const agentSourceTypeEnum = pgEnum("agent_source_type", ["doc", "task"]);

export const agentJobStatusEnum = pgEnum("agent_job_status", [
  "pending",
  "running",
  "awaiting_confirmation",
  "completed",
  "failed",
]);

export const agentRunStatusEnum = pgEnum("agent_run_status", [
  "running",
  "completed",
  "failed",
]);

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    userMessageId: text("user_message_id").notNull(),
    status: agentJobStatusEnum("status").notNull(),
    mode: text("mode").$type<AgentMode>().notNull().default("execute"),
    webResearch: boolean("web_research").notNull().default(false),
    webSearchCapability: text("web_search_capability")
      .$type<WebSearchCapability>()
      .notNull()
      .default("none"),
    idempotencyKey: text("idempotency_key").notNull(),
    pendingToolCalls: jsonb("pending_tool_calls").$type<
      PendingToolCall[] | null
    >(),
    confirmationDecision: text(
      "confirmation_decision",
    ).$type<ConfirmationDecision | null>(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("jobs_conversation_idempotency_unique").on(
      table.conversationId,
      table.idempotencyKey,
    ),
  ],
);

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    attempt: integer("attempt").notNull(),
    status: agentRunStatusEnum("status").notNull(),
    model: text("model").notNull(),
    provider: text("provider").$type<AiProvider>().notNull().default("ollama"),
    webSearchCalls: integer("web_search_calls"),
    estimatedCostMicroUsd: integer("estimated_cost_micro_usd"),
    outcomeText: text("outcome_text"),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    iterationCount: integer("iteration_count").notNull().default(0),
    maxIterations: integer("max_iterations").notNull(),
    maxDurationMs: integer("max_duration_ms").notNull(),
    maxTokens: integer("max_tokens").notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at")
      .$defaultFn(() => new Date())
      .notNull(),
    finishedAt: timestamp("finished_at"),
  },
  (table) => [
    uniqueIndex("agent_runs_job_attempt_unique").on(table.jobId, table.attempt),
  ],
);

export const conversationMessages = pgTable(
  "conversation_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    jobId: text("job_id").references(() => jobs.id, { onDelete: "set null" }),
    agentRunId: text("agent_run_id").references(() => agentRuns.id, {
      onDelete: "set null",
    }),
    position: integer("position").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull().default(""),
    toolCalls: jsonb("tool_calls"),
    toolCallId: text("tool_call_id"),
    citations: jsonb("citations").$type<MessageCitation[] | null>(),
    providerItems: jsonb("provider_items"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("conversation_messages_position_unique").on(
      table.conversationId,
      table.position,
    ),
  ],
);

export const agentToolExecutions = pgTable(
  "agent_tool_executions",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    agentRunId: text("agent_run_id")
      .notNull()
      .references(() => agentRuns.id, { onDelete: "cascade" }),
    toolCallId: text("tool_call_id").notNull(),
    toolName: text("tool_name").notNull(),
    arguments: jsonb("arguments").notNull(),
    status: text("status").notNull(),
    result: jsonb("result").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("agent_tool_executions_job_tool_call_unique").on(
      table.jobId,
      table.toolCallId,
    ),
  ],
);

export const agentDocuments = pgTable(
  "agent_documents",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    sourceType: agentSourceTypeEnum("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    title: text("title").notNull(),
  },
  (table) => [
    uniqueIndex("agent_documents_source_unique").on(
      table.workspaceId,
      table.sourceType,
      table.sourceId,
    ),
  ],
);

export const AGENT_CHUNK_EMBEDDING_DIMENSIONS = 768;

export const agentChunks = pgTable(
  "agent_chunks",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => agentDocuments.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", {
      dimensions: AGENT_CHUNK_EMBEDDING_DIMENSIONS,
    }).notNull(),
  },
  (table) => [
    uniqueIndex("agent_chunks_document_position_unique").on(
      table.documentId,
      table.position,
    ),
  ],
);

export const agentToolAllows = pgTable(
  "agent_tool_allows",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    toolName: text("tool_name").notNull(),
    argumentsJson: text("arguments_json").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("agent_tool_allows_request_unique").on(
      table.workspaceId,
      table.userId,
      table.toolName,
      table.argumentsJson,
    ),
  ],
);

export const agentMemories = pgTable(
  "agent_memories",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    conversationId: text("conversation_id").references(() => conversations.id, {
      onDelete: "set null",
    }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("agent_memories_workspace_content_unique").on(
      table.workspaceId,
      table.content,
    ),
    index("agent_memories_workspace_created_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
  ],
);

export type ConversationRow = typeof conversations.$inferSelect;
export type ConversationMessageRow = typeof conversationMessages.$inferSelect;
export type JobRow = typeof jobs.$inferSelect;
export type ConfirmationDecision = "approved" | "rejected";
export type AgentMode = "execute" | "ask";

export interface PendingToolCall {
  id: string;
  name: string;
  arguments: unknown;
  sources?: MessageCitation[];
}

export type AiProvider = "ollama" | "openai";
export type WebSearchCapability = "native" | "tool" | "none";

export interface MessageCitation {
  url: string;
  title: string;
  snippet?: string;
  publishedAt?: string;
  startIndex?: number;
  endIndex?: number;
}
export type AgentRunRow = typeof agentRuns.$inferSelect;
export type AgentToolExecutionRow = typeof agentToolExecutions.$inferSelect;
export type AgentMemoryRow = typeof agentMemories.$inferSelect;
export type AgentToolAllowRow = typeof agentToolAllows.$inferSelect;
export type AgentDocumentRow = typeof agentDocuments.$inferSelect;
export type AgentChunkRow = typeof agentChunks.$inferSelect;

export type DocRow = typeof docs.$inferSelect;
export type CalendarEventRow = typeof calendarEvents.$inferSelect;
export type CalendarEventTemplateRow =
  typeof calendarEventTemplates.$inferSelect;
export type GoogleCalendarIntegrationRow =
  typeof googleCalendarIntegrations.$inferSelect;
export type ExecutionSessionRow = typeof executionSessions.$inferSelect;
export type ExecutionSessionTaskRow = typeof executionSessionTasks.$inferSelect;
export type ExecutionQueueRow = typeof executionQueue.$inferSelect;
export type ExecutionCurrentRow = typeof executionCurrent.$inferSelect;

export type StoredCalendarRsvp = CalendarRsvpStatus;

interface TaskAcceptanceCriterion {
  id: string;
  text: string;
  done: boolean;
}
