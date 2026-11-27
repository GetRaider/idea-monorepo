CREATE TYPE "public"."counter_frequency" AS ENUM('daily', 'weekly', 'monthly');
--> statement-breakpoint
CREATE TYPE "public"."counter_status" AS ENUM('active', 'archived');
--> statement-breakpoint
CREATE TYPE "public"."counter_occurrence_status" AS ENUM('completed', 'skipped', 'failed');
--> statement-breakpoint
CREATE TYPE "public"."counter_occurrence_source" AS ENUM('manual', 'task', 'system');
--> statement-breakpoint
CREATE TYPE "public"."counter_period_outcome" AS ENUM('met', 'excused', 'failed');
--> statement-breakpoint
CREATE TABLE "counters" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "frequency" "counter_frequency" NOT NULL,
  "interval" integer NOT NULL,
  "target" integer NOT NULL,
  "time_zone" text NOT NULL,
  "anchor_date" date NOT NULL,
  "show_in_today" boolean DEFAULT true NOT NULL,
  "status" "counter_status" DEFAULT 'active' NOT NULL,
  "closed_through" date NOT NULL,
  "pending_change" jsonb,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  CONSTRAINT "counters_target_positive" CHECK ("target" > 0),
  CONSTRAINT "counters_interval_positive" CHECK ("interval" > 0)
);
--> statement-breakpoint
CREATE INDEX "counters_workspace_status_idx" ON "counters" ("workspace_id","status");
--> statement-breakpoint
CREATE TABLE "counter_links" (
  "id" text PRIMARY KEY NOT NULL,
  "counter_id" text NOT NULL REFERENCES "counters"("id") ON DELETE cascade,
  "task_id" text REFERENCES "tasks"("id") ON DELETE cascade,
  "series_id" text,
  "created_at" timestamp NOT NULL,
  CONSTRAINT "counter_links_one_target" CHECK (num_nonnulls("task_id", "series_id") = 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "counter_links_counter_task_unique" ON "counter_links" ("counter_id","task_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "counter_links_counter_series_unique" ON "counter_links" ("counter_id","series_id");
--> statement-breakpoint
CREATE INDEX "counter_links_task_id_idx" ON "counter_links" ("task_id");
--> statement-breakpoint
CREATE INDEX "counter_links_series_id_idx" ON "counter_links" ("series_id");
--> statement-breakpoint
CREATE TABLE "counter_occurrences" (
  "id" text PRIMARY KEY NOT NULL,
  "counter_id" text NOT NULL REFERENCES "counters"("id") ON DELETE cascade,
  "local_date" date NOT NULL,
  "status" "counter_occurrence_status" NOT NULL,
  "skip_reason" text,
  "source" "counter_occurrence_source" NOT NULL,
  "task_id" text REFERENCES "tasks"("id") ON DELETE set null,
  "created_at" timestamp NOT NULL,
  CONSTRAINT "counter_occurrences_skip_reason" CHECK (("status" = 'skipped') = ("skip_reason" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "counter_occurrences_counter_task_unique" ON "counter_occurrences" ("counter_id","task_id") WHERE "task_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "counter_occurrences_counter_date_idx" ON "counter_occurrences" ("counter_id","local_date");
--> statement-breakpoint
CREATE INDEX "counter_occurrences_task_id_idx" ON "counter_occurrences" ("task_id");
--> statement-breakpoint
CREATE TABLE "counter_periods" (
  "id" text PRIMARY KEY NOT NULL,
  "counter_id" text NOT NULL REFERENCES "counters"("id") ON DELETE cascade,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "target" integer NOT NULL,
  "completed" integer NOT NULL,
  "skipped" integer NOT NULL,
  "failed" integer NOT NULL,
  "outcome" "counter_period_outcome" NOT NULL,
  "created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "counter_periods_counter_start_unique" ON "counter_periods" ("counter_id","start_date");
