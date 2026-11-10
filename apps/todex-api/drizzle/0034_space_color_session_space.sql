ALTER TABLE "spaces" ADD COLUMN "color" text DEFAULT '#B8A4D1' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "color";--> statement-breakpoint
ALTER TABLE "calendar_events" DROP COLUMN "color";--> statement-breakpoint
ALTER TABLE "calendar_event_templates" DROP COLUMN "color";--> statement-breakpoint
DELETE FROM "execution_session_tasks";--> statement-breakpoint
DELETE FROM "execution_sessions";--> statement-breakpoint
ALTER TABLE "execution_sessions" ADD COLUMN "space_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "execution_sessions" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "execution_sessions" ADD CONSTRAINT "execution_sessions_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "execution_sessions_workspace_space_started_idx" ON "execution_sessions" USING btree ("workspace_id","space_id","started_at");
