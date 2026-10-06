CREATE TYPE "public"."doc_mention_target" AS ENUM('task', 'doc', 'event');--> statement-breakpoint
CREATE TYPE "public"."doc_type" AS ENUM('common', 'goal');--> statement-breakpoint
CREATE TABLE "doc_mentions" (
	"doc_id" text NOT NULL,
	"target_type" "doc_mention_target" NOT NULL,
	"target_id" text NOT NULL,
	CONSTRAINT "doc_mentions_doc_id_target_type_target_id_pk" PRIMARY KEY("doc_id","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "doc_tasks" (
	"doc_id" text NOT NULL,
	"task_id" text NOT NULL,
	CONSTRAINT "doc_tasks_doc_id_task_id_pk" PRIMARY KEY("doc_id","task_id")
);
--> statement-breakpoint
CREATE TABLE "docs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"folder_id" text,
	"type" "doc_type" NOT NULL,
	"title" text NOT NULL,
	"body" jsonb NOT NULL,
	"plain_text" jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doc_mentions" ADD CONSTRAINT "doc_mentions_doc_id_docs_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."docs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_tasks" ADD CONSTRAINT "doc_tasks_doc_id_docs_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."docs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doc_tasks" ADD CONSTRAINT "doc_tasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docs" ADD CONSTRAINT "docs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docs" ADD CONSTRAINT "docs_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doc_mentions_target_idx" ON "doc_mentions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "doc_tasks_task_id_idx" ON "doc_tasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "docs_workspace_id_idx" ON "docs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "docs_folder_id_idx" ON "docs" USING btree ("folder_id");