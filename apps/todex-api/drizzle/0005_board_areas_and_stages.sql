CREATE TABLE "board_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_progress_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"board_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "area_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "progress_stage_id" text;--> statement-breakpoint
ALTER TABLE "board_areas" ADD CONSTRAINT "board_areas_board_id_task_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."task_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_progress_stages" ADD CONSTRAINT "board_progress_stages_board_id_task_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."task_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "board_areas_board_position_unique" ON "board_areas" USING btree ("board_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "board_areas_board_name_unique" ON "board_areas" USING btree ("board_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "board_areas_default_unique" ON "board_areas" USING btree ("board_id") WHERE "board_areas"."is_default" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "board_progress_stages_board_position_unique" ON "board_progress_stages" USING btree ("board_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "board_progress_stages_board_name_unique" ON "board_progress_stages" USING btree ("board_id",lower("name"));--> statement-breakpoint
INSERT INTO "board_areas" ("id", "board_id", "name", "position", "is_default", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "id", 'General', 0, true, now(), now()
FROM "task_boards";--> statement-breakpoint
UPDATE "tasks"
SET "area_id" = "board_areas"."id"
FROM "board_areas"
WHERE "board_areas"."board_id" = "tasks"."task_board_id"
  AND "board_areas"."is_default" = true;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "area_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_area_id_board_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."board_areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_progress_stage_id_board_progress_stages_id_fk" FOREIGN KEY ("progress_stage_id") REFERENCES "public"."board_progress_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_area_id_idx" ON "tasks" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "tasks_progress_stage_id_idx" ON "tasks" USING btree ("progress_stage_id");
