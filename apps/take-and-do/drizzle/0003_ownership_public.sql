ALTER TABLE "folders" ADD COLUMN IF NOT EXISTS "user_id" text;
ALTER TABLE "folders" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "task_boards" ADD COLUMN IF NOT EXISTS "user_id" text;
ALTER TABLE "task_boards" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "user_id" text;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "folders" SET "user_id" = (SELECT id FROM "user" ORDER BY "created_at" ASC LIMIT 1) WHERE "user_id" IS NULL;
--> statement-breakpoint
UPDATE "task_boards" SET "user_id" = (SELECT id FROM "user" ORDER BY "created_at" ASC LIMIT 1) WHERE "user_id" IS NULL;
--> statement-breakpoint
UPDATE "tasks" SET "user_id" = (SELECT id FROM "user" ORDER BY "created_at" ASC LIMIT 1) WHERE "user_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "task_boards" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_boards" ADD CONSTRAINT "task_boards_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
