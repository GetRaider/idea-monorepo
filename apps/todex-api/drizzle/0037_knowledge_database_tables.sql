CREATE TABLE "knowledge_databases" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "space_id" text NOT NULL REFERENCES "spaces"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "knowledge_databases_workspace_idx" ON "knowledge_databases" ("workspace_id");
--> statement-breakpoint
CREATE TABLE "knowledge_database_properties" (
  "id" text PRIMARY KEY NOT NULL,
  "database_id" text NOT NULL REFERENCES "knowledge_databases"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "options" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "position" integer NOT NULL,
  CONSTRAINT "knowledge_database_properties_type_check" CHECK ("type" IN ('title', 'text', 'number', 'select', 'multi_select', 'date', 'checkbox'))
);
--> statement-breakpoint
CREATE INDEX "knowledge_database_properties_database_idx" ON "knowledge_database_properties" ("database_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_database_properties_position_unique" ON "knowledge_database_properties" ("database_id", "position");
--> statement-breakpoint
CREATE TABLE "knowledge_database_rows" (
  "id" text PRIMARY KEY NOT NULL,
  "database_id" text NOT NULL REFERENCES "knowledge_databases"("id") ON DELETE CASCADE,
  "cells" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "position" integer NOT NULL,
  "updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "knowledge_database_rows_database_idx" ON "knowledge_database_rows" ("database_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_database_rows_position_unique" ON "knowledge_database_rows" ("database_id", "position");
--> statement-breakpoint
CREATE TABLE "knowledge_database_views" (
  "id" text PRIMARY KEY NOT NULL,
  "database_id" text NOT NULL REFERENCES "knowledge_databases"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "kind" text NOT NULL DEFAULT 'table',
  "sorts" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "filters" jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT "knowledge_database_views_kind_check" CHECK ("kind" = 'table')
);
--> statement-breakpoint
CREATE INDEX "knowledge_database_views_database_idx" ON "knowledge_database_views" ("database_id");
