CREATE TYPE "public"."planning_status" AS ENUM('planned', 'in_progress', 'completed', 'canceled');--> statement-breakpoint
CREATE TABLE "epics" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "planning_status" DEFAULT 'planned' NOT NULL,
	"target_date" timestamp,
	"owner_user_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"space_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "planning_status" DEFAULT 'planned' NOT NULL,
	"target_date" timestamp,
	"owner_user_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_progress_stages" RENAME TO "space_progress_stages";--> statement-breakpoint
ALTER TABLE "board_areas" RENAME TO "space_sections";--> statement-breakpoint
ALTER TABLE "task_boards" RENAME TO "spaces";--> statement-breakpoint
ALTER TABLE "space_sections" RENAME COLUMN "board_id" TO "space_id";--> statement-breakpoint
ALTER TABLE "space_progress_stages" RENAME COLUMN "board_id" TO "space_id";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "task_board_id" TO "space_id";--> statement-breakpoint
ALTER TABLE "tasks" RENAME COLUMN "area_id" TO "section_id";--> statement-breakpoint
ALTER TABLE "space_sections" DROP CONSTRAINT "board_areas_board_id_task_boards_id_fk";
--> statement-breakpoint
ALTER TABLE "space_progress_stages" DROP CONSTRAINT "board_progress_stages_board_id_task_boards_id_fk";
--> statement-breakpoint
ALTER TABLE "spaces" DROP CONSTRAINT "task_boards_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "spaces" DROP CONSTRAINT "task_boards_folder_id_folders_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_task_board_id_task_boards_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_area_id_board_areas_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_progress_stage_id_board_progress_stages_id_fk";
--> statement-breakpoint
DROP INDEX "board_areas_board_position_unique";--> statement-breakpoint
DROP INDEX "board_areas_board_name_unique";--> statement-breakpoint
DROP INDEX "board_areas_default_unique";--> statement-breakpoint
DROP INDEX "board_progress_stages_board_position_unique";--> statement-breakpoint
DROP INDEX "board_progress_stages_board_name_unique";--> statement-breakpoint
DROP INDEX "tasks_area_id_idx";--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "epic_id" text;--> statement-breakpoint
ALTER TABLE "epics" ADD CONSTRAINT "epics_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "epics" ADD CONSTRAINT "epics_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "epics_project_name_unique" ON "epics" USING btree ("project_id",lower("name"));--> statement-breakpoint
CREATE INDEX "epics_project_id_idx" ON "epics" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_space_name_unique" ON "projects" USING btree ("space_id",lower("name"));--> statement-breakpoint
CREATE INDEX "projects_space_id_idx" ON "projects" USING btree ("space_id");--> statement-breakpoint
ALTER TABLE "space_sections" ADD CONSTRAINT "space_sections_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_progress_stages" ADD CONSTRAINT "space_progress_stages_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_section_id_space_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."space_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_progress_stage_id_space_progress_stages_id_fk" FOREIGN KEY ("progress_stage_id") REFERENCES "public"."space_progress_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_epic_id_epics_id_fk" FOREIGN KEY ("epic_id") REFERENCES "public"."epics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "space_sections_space_position_unique" ON "space_sections" USING btree ("space_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "space_sections_space_name_unique" ON "space_sections" USING btree ("space_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "space_sections_default_unique" ON "space_sections" USING btree ("space_id") WHERE "space_sections"."is_default" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "space_progress_stages_space_position_unique" ON "space_progress_stages" USING btree ("space_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "space_progress_stages_space_name_unique" ON "space_progress_stages" USING btree ("space_id",lower("name"));--> statement-breakpoint
CREATE INDEX "tasks_section_id_idx" ON "tasks" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "tasks_project_id_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_epic_id_idx" ON "tasks" USING btree ("epic_id");