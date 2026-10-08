CREATE TABLE "execution_session_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"task_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"intervals" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "execution_sessions" DROP CONSTRAINT "execution_sessions_task_id_tasks_id_fk";
--> statement-breakpoint
DROP INDEX "execution_sessions_task_id_idx";--> statement-breakpoint
ALTER TABLE "execution_session_tasks" ADD CONSTRAINT "execution_session_tasks_session_id_execution_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."execution_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_session_tasks" ADD CONSTRAINT "execution_session_tasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "execution_session_tasks_session_task_unique" ON "execution_session_tasks" USING btree ("session_id","task_id");--> statement-breakpoint
CREATE INDEX "execution_session_tasks_task_id_idx" ON "execution_session_tasks" USING btree ("task_id");--> statement-breakpoint
INSERT INTO "execution_session_tasks" ("id", "session_id", "task_id", "position", "intervals")
SELECT
  "id",
  "id",
  "task_id",
  0,
  jsonb_build_array(
    jsonb_build_object(
      'startedAt',
      to_char("started_at" AT TIME ZONE 'UTC' AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'endedAt',
      CASE
        WHEN "ended_at" IS NULL THEN NULL
        ELSE to_char("ended_at" AT TIME ZONE 'UTC' AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      END
    )
  )
FROM "execution_sessions"
WHERE "task_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "execution_sessions" DROP COLUMN "task_id";