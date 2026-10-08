CREATE TYPE "public"."execution_executor_type" AS ENUM('human', 'ai');--> statement-breakpoint
CREATE TABLE "execution_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"task_id" text,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration" integer,
	"executor_type" "execution_executor_type" DEFAULT 'human' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "execution_queue" ADD CONSTRAINT "execution_queue_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_queue" ADD CONSTRAINT "execution_queue_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_sessions" ADD CONSTRAINT "execution_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_sessions" ADD CONSTRAINT "execution_sessions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "execution_queue_workspace_task_unique" ON "execution_queue" USING btree ("workspace_id","task_id");--> statement-breakpoint
CREATE INDEX "execution_queue_workspace_position_idx" ON "execution_queue" USING btree ("workspace_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "execution_sessions_open_workspace_unique" ON "execution_sessions" USING btree ("workspace_id") WHERE "execution_sessions"."ended_at" is null;--> statement-breakpoint
CREATE INDEX "execution_sessions_workspace_started_idx" ON "execution_sessions" USING btree ("workspace_id","started_at");--> statement-breakpoint
CREATE INDEX "execution_sessions_task_id_idx" ON "execution_sessions" USING btree ("task_id");