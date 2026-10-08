CREATE TABLE "execution_current" (
	"workspace_id" text PRIMARY KEY NOT NULL,
	"task_id" text,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "execution_current" ADD CONSTRAINT "execution_current_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_current" ADD CONSTRAINT "execution_current_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;