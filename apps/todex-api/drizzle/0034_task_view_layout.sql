CREATE TYPE "public"."task_complexity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_lifecycle_action" AS ENUM('done', 'cancelled', 'delete');--> statement-breakpoint
CREATE TYPE "public"."series_exception_kind" AS ENUM('skipped', 'deleted');--> statement-breakpoint
CREATE TABLE "recurring_series" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"anchor" timestamp NOT NULL,
	"rule" jsonb NOT NULL,
	"rule_version" integer NOT NULL,
	"stopped_at" timestamp,
	"rule_effective_at" timestamp NOT NULL,
	"cursor_rule_version" integer NOT NULL,
	"generated_through" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);--> statement-breakpoint
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recurring_series_workspace_stopped_idx" ON "recurring_series" USING btree ("workspace_id","stopped_at");--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "outcome" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "complexity" "task_complexity";--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "owner_id" text;--> statement-breakpoint
UPDATE "tasks" AS task
SET "owner_id" = member.user_id
FROM (
	SELECT DISTINCT ON (workspace_id) workspace_id, user_id
	FROM "workspace_members"
	WHERE role = 'owner'
	ORDER BY workspace_id, created_at ASC
) AS member
WHERE task.workspace_id = member.workspace_id
	AND task.owner_id IS NULL;--> statement-breakpoint
DELETE FROM "tasks" WHERE "owner_id" IS NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "series_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_series_id_recurring_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."recurring_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "occurrence_key" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "occurrence_anchor" timestamp;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "origin_series_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "overridden_fields" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_series_occurrence_key_unique" ON "tasks" USING btree ("series_id","occurrence_key") WHERE "series_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_series_occurrence_anchor_unique" ON "tasks" USING btree ("series_id","occurrence_anchor") WHERE "series_id" is not null;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "schedule_date";--> statement-breakpoint
CREATE TABLE "task_schedule_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"retired_at" timestamp,
	CONSTRAINT "task_schedule_slots_end_after_start" CHECK ("end_at" > "start_at")
);--> statement-breakpoint
ALTER TABLE "task_schedule_slots" ADD CONSTRAINT "task_schedule_slots_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_schedule_slots" ADD CONSTRAINT "task_schedule_slots_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_schedule_slots_task_id_idx" ON "task_schedule_slots" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_schedule_slots_range_idx" ON "task_schedule_slots" USING btree ("workspace_id","start_at","end_at");--> statement-breakpoint
CREATE TABLE "task_lifecycle_locks" (
	"task_id" text PRIMARY KEY NOT NULL,
	"transition_id" text NOT NULL,
	"action" "task_lifecycle_action" NOT NULL,
	"expires_at" timestamp NOT NULL
);--> statement-breakpoint
ALTER TABLE "task_lifecycle_locks" ADD CONSTRAINT "task_lifecycle_locks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "series_template_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"series_id" text NOT NULL,
	"effective_at" timestamp NOT NULL,
	"template" jsonb NOT NULL
);--> statement-breakpoint
ALTER TABLE "series_template_versions" ADD CONSTRAINT "series_template_versions_series_id_recurring_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."recurring_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "series_template_versions_effective_unique" ON "series_template_versions" USING btree ("series_id","effective_at");--> statement-breakpoint
CREATE TABLE "series_exceptions" (
	"id" text PRIMARY KEY NOT NULL,
	"series_id" text NOT NULL,
	"occurrence_key" text NOT NULL,
	"kind" "series_exception_kind" NOT NULL
);--> statement-breakpoint
ALTER TABLE "series_exceptions" ADD CONSTRAINT "series_exceptions_series_id_recurring_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."recurring_series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "series_exceptions_key_unique" ON "series_exceptions" USING btree ("series_id","occurrence_key");--> statement-breakpoint
CREATE TABLE "task_references" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text NOT NULL,
	"kind" text NOT NULL,
	"doc_id" text,
	"conversation_id" text,
	"url" text,
	"title" text NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "task_references_kind" CHECK ("kind" in ('doc', 'conversation', 'url')),
	CONSTRAINT "task_references_target" CHECK ((
		("kind" = 'doc' and "doc_id" is not null and "conversation_id" is null and "url" is null)
		or ("kind" = 'conversation' and "conversation_id" is not null and "doc_id" is null and "url" is null)
		or ("kind" = 'url' and "url" is not null and "doc_id" is null and "conversation_id" is null)
	))
);--> statement-breakpoint
ALTER TABLE "task_references" ADD CONSTRAINT "task_references_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_references" ADD CONSTRAINT "task_references_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_references" ADD CONSTRAINT "task_references_doc_id_docs_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."docs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_references" ADD CONSTRAINT "task_references_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_references_task_id_idx" ON "task_references" USING btree ("task_id");