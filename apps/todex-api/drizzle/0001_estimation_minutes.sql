ALTER TABLE "tasks" ADD COLUMN "estimation" integer;--> statement-breakpoint
UPDATE "tasks" SET "estimation" = ROUND("estimation_days" * 1440)::integer WHERE "estimation_days" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "estimation_days";
