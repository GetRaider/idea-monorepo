ALTER TABLE "labels" ADD COLUMN IF NOT EXISTS "user_id" text;
--> statement-breakpoint
UPDATE "labels" SET "user_id" = (SELECT "id" FROM "user" ORDER BY "created_at" ASC LIMIT 1) WHERE "user_id" IS NULL;
--> statement-breakpoint
DELETE FROM "labels" WHERE "user_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "labels" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "labels" ADD CONSTRAINT "labels_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "labels" DROP CONSTRAINT IF EXISTS "labels_name_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "labels_name_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "labels_user_id_name_unique" ON "labels" USING btree ("user_id","name");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_labels" (
	"task_id" text NOT NULL,
	"label_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "task_labels_task_id_label_id_pk" PRIMARY KEY("task_id","label_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_labels_label_id_idx" ON "task_labels" USING btree ("label_id");
