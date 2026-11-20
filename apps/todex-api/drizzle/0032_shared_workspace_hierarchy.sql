CREATE TYPE "public"."relation_entity_type" AS ENUM('task', 'doc', 'epic', 'event', 'space', 'doc_folder');--> statement-breakpoint
CREATE TYPE "public"."relation_kind" AS ENUM('references', 'related_to', 'depends_on');--> statement-breakpoint
CREATE TYPE "public"."relation_origin" AS ENUM('mention', 'explicit');--> statement-breakpoint
CREATE TABLE "doc_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"space_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_relations" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"source_type" "relation_entity_type" NOT NULL,
	"source_id" text NOT NULL,
	"target_type" "relation_entity_type" NOT NULL,
	"target_id" text NOT NULL,
	"kind" "relation_kind" NOT NULL,
	"origin" "relation_origin" NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "entity_relations_references_origin" CHECK (("entity_relations"."kind" = 'references') = ("entity_relations"."origin" = 'mention')),
	CONSTRAINT "entity_relations_explicit_origin" CHECK (("entity_relations"."kind" in ('related_to', 'depends_on')) = ("entity_relations"."origin" = 'explicit')),
	CONSTRAINT "entity_relations_related_order" CHECK ("entity_relations"."kind" <> 'related_to' OR ("entity_relations"."source_type", "entity_relations"."source_id") < ("entity_relations"."target_type", "entity_relations"."target_id"))
);
--> statement-breakpoint
CREATE TABLE "space_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"emoji" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doc_mentions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "folders" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "doc_mentions" CASCADE;--> statement-breakpoint
DROP TABLE "folders" CASCADE;--> statement-breakpoint
ALTER TABLE "docs" DROP CONSTRAINT IF EXISTS "docs_folder_id_folders_id_fk";
--> statement-breakpoint
ALTER TABLE "spaces" DROP CONSTRAINT IF EXISTS "spaces_folder_id_folders_id_fk";
--> statement-breakpoint
DROP INDEX "calendar_events_workspace_start_idx";--> statement-breakpoint
ALTER TABLE "calendar_event_templates" ADD COLUMN "space_id" text;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD COLUMN "space_id" text;--> statement-breakpoint
ALTER TABLE "docs" ADD COLUMN "space_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "focal_type" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "focal_id" text;--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "space_folder_id" text;--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "is_inbox" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "doc_folders" ADD CONSTRAINT "doc_folders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_folders" ADD CONSTRAINT "doc_folders_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_folders" ADD CONSTRAINT "space_folders_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doc_folders_space_id_idx" ON "doc_folders" USING btree ("space_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_relations_edge_unique" ON "entity_relations" USING btree ("workspace_id","source_type","source_id","target_type","target_id","kind");--> statement-breakpoint
CREATE INDEX "entity_relations_target_idx" ON "entity_relations" USING btree ("workspace_id","target_type","target_id");--> statement-breakpoint
CREATE INDEX "entity_relations_source_idx" ON "entity_relations" USING btree ("workspace_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "space_folders_workspace_id_idx" ON "space_folders" USING btree ("workspace_id");--> statement-breakpoint
ALTER TABLE "calendar_event_templates" ADD CONSTRAINT "calendar_event_templates_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docs" ADD CONSTRAINT "docs_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docs" ADD CONSTRAINT "docs_folder_id_doc_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."doc_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_space_folder_id_space_folders_id_fk" FOREIGN KEY ("space_folder_id") REFERENCES "public"."space_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_events_workspace_space_start_idx" ON "calendar_events" USING btree ("workspace_id","space_id","start");--> statement-breakpoint
CREATE INDEX "docs_space_id_idx" ON "docs" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "spaces_workspace_folder_idx" ON "spaces" USING btree ("workspace_id","space_folder_id");--> statement-breakpoint
CREATE UNIQUE INDEX "spaces_workspace_inbox_unique" ON "spaces" USING btree ("workspace_id") WHERE "spaces"."is_inbox" = true;--> statement-breakpoint
ALTER TABLE "spaces" DROP COLUMN "folder_id";--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_focal_pair" CHECK (("jobs"."focal_type" is null) = ("jobs"."focal_id" is null));--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_focal_type" CHECK ("jobs"."focal_type" is null OR "jobs"."focal_type" in ('task', 'doc'));--> statement-breakpoint
DROP TYPE "public"."doc_mention_target";--> statement-breakpoint
DROP TYPE "public"."folder_kind";