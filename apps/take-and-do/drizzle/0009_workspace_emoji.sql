ALTER TABLE "folders" ADD COLUMN IF NOT EXISTS "emoji" text;
--> statement-breakpoint
ALTER TABLE "task_boards" ADD COLUMN IF NOT EXISTS "emoji" text;
