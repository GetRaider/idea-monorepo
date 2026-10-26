ALTER TABLE "epics" ADD COLUMN "space_id" text;--> statement-breakpoint
UPDATE "epics" AS epic
SET "space_id" = project."space_id"
FROM "projects" AS project
WHERE epic."project_id" = project."id";--> statement-breakpoint
ALTER TABLE "epics" ALTER COLUMN "space_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "epics" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "epics" ALTER COLUMN "status" SET DATA TYPE "public"."task_status" USING (
  CASE "status"::text
    WHEN 'planned' THEN 'todo'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'completed' THEN 'done'
    WHEN 'canceled' THEN 'cancelled'
    ELSE 'todo'
  END
)::"public"."task_status";--> statement-breakpoint
ALTER TABLE "epics" ALTER COLUMN "status" SET DEFAULT 'todo';--> statement-breakpoint
ALTER TABLE "epics" DROP CONSTRAINT "epics_project_id_projects_id_fk";--> statement-breakpoint
ALTER TABLE "epics" DROP CONSTRAINT "epics_owner_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_project_id_projects_id_fk";--> statement-breakpoint
DROP INDEX "epics_project_name_unique";--> statement-breakpoint
DROP INDEX "epics_project_id_idx";--> statement-breakpoint
DROP INDEX "tasks_project_id_idx";--> statement-breakpoint
ALTER TABLE "epics" DROP COLUMN "project_id";--> statement-breakpoint
ALTER TABLE "epics" DROP COLUMN "target_date";--> statement-breakpoint
ALTER TABLE "epics" DROP COLUMN "owner_user_id";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "project_id";--> statement-breakpoint
ALTER TABLE "epics" ADD CONSTRAINT "epics_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "epics_space_name_unique" ON "epics" USING btree ("space_id", lower("name"));--> statement-breakpoint
CREATE INDEX "epics_space_id_idx" ON "epics" USING btree ("space_id");--> statement-breakpoint
DROP TABLE "projects" CASCADE;--> statement-breakpoint
DROP TYPE "public"."planning_status";
