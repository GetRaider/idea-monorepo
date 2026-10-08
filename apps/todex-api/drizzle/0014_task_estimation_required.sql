UPDATE "tasks" SET "estimation" = 30 WHERE "estimation" IS NULL OR "estimation" < 1;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "estimation" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_estimation_positive" CHECK ("tasks"."estimation" > 0);