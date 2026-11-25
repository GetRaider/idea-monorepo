CREATE TYPE "public"."check_in_status" AS ENUM('completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."skip_reason" AS ENUM('sick', 'travel', 'day_off', 'too_busy', 'other');--> statement-breakpoint
CREATE TABLE "life_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slot_limit" smallint DEFAULT 2 NOT NULL
);
--> statement-breakpoint
INSERT INTO "life_areas" ("id", "name", "slot_limit") VALUES
	('health', 'Health', 2),
	('fitness', 'Fitness', 2),
	('mind', 'Mind', 2),
	('work', 'Work', 2),
	('home', 'Home', 2),
	('relationships', 'Relationships', 2),
	('learning', 'Learning', 2),
	('other', 'Other', 2);
--> statement-breakpoint
UPDATE "habits" SET "status" = 'backlog' WHERE "status" = 'paused';--> statement-breakpoint
ALTER TABLE "habits" DROP CONSTRAINT "habits_title_length_check";--> statement-breakpoint
ALTER TABLE "habits" DROP CONSTRAINT "habits_description_length_check";--> statement-breakpoint
ALTER TABLE "habits" DROP CONSTRAINT "habits_minimum_action_length_check";--> statement-breakpoint
ALTER TABLE "habits" DROP CONSTRAINT "habits_duration_check";--> statement-breakpoint
ALTER TABLE "habits" DROP CONSTRAINT "habits_complete_plan_check";--> statement-breakpoint
ALTER TABLE "habits" DROP CONSTRAINT "habits_why_length_check";--> statement-breakpoint
ALTER TABLE "habits" DROP CONSTRAINT "habits_trigger_length_check";--> statement-breakpoint
ALTER TABLE "habits" DROP CONSTRAINT "habits_weekdays_check";--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "life_area_id" text;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "acceptance_criteria" text;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "checkpoints_per_day" smallint;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "checkpoint_labels" text[];--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "establishing_started_at" timestamp with time zone;--> statement-breakpoint
UPDATE "habits" SET
	"life_area_id" = "category"::text,
	"name" = "title",
	"why" = coalesce(nullif(btrim("why"), ''), 'Why was not recorded yet.'),
	"trigger" = coalesce(nullif(btrim("trigger"), ''), 'Trigger was not recorded yet.'),
	"acceptance_criteria" = coalesce(nullif(btrim("minimum_action"), ''), 'Acceptance criteria were not recorded yet.'),
	"checkpoints_per_day" = 1,
	"weekdays" = coalesce("weekdays", ARRAY[1,2,3,4,5,6,7]::smallint[]),
	"establishing_started_at" = CASE
		WHEN "status" IN ('establishing', 'established') THEN coalesce("activated_at", "created_at")
		ELSE NULL
	END;
--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "life_area_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "acceptance_criteria" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "checkpoints_per_day" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "why" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "trigger" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "weekdays" SET NOT NULL;--> statement-breakpoint
DROP TABLE "habit_status_events" CASCADE;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "status" SET DEFAULT 'backlog'::text;--> statement-breakpoint
DROP TYPE "public"."habit_status";--> statement-breakpoint
CREATE TYPE "public"."habit_status" AS ENUM('backlog', 'establishing', 'established');--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "status" SET DEFAULT 'backlog'::"public"."habit_status";--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "status" SET DATA TYPE "public"."habit_status" USING "status"::"public"."habit_status";--> statement-breakpoint
DROP INDEX "habits_status_updated_idx";--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" text PRIMARY KEY NOT NULL,
	"habit_id" text NOT NULL,
	"check_in_date" date NOT NULL,
	"checkpoint_index" smallint NOT NULL,
	"status" "check_in_status" NOT NULL,
	"skip_reason" "skip_reason",
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_ins_habit_date_index_key" UNIQUE("habit_id","check_in_date","checkpoint_index"),
	CONSTRAINT "check_ins_index_check" CHECK ("check_ins"."checkpoint_index" between 0 and 11),
	CONSTRAINT "check_ins_skip_reason_check" CHECK (("check_ins"."status" = 'skipped' and "check_ins"."skip_reason" is not null) or ("check_ins"."status" <> 'skipped' and "check_ins"."skip_reason" is null)),
	CONSTRAINT "check_ins_note_length_check" CHECK ("check_ins"."note" is null or char_length("check_ins"."note") between 1 and 500)
);
--> statement-breakpoint
INSERT INTO "check_ins" (
	"id",
	"habit_id",
	"check_in_date",
	"checkpoint_index",
	"status",
	"skip_reason",
	"created_at",
	"updated_at"
)
SELECT
	"habit_id" || ':' || "practice_date"::text || ':0',
	"habit_id",
	"practice_date",
	0,
	"outcome"::text::"check_in_status",
	CASE WHEN "outcome"::text = 'skipped' THEN 'other'::"skip_reason" ELSE NULL END,
	"created_at",
	"updated_at"
FROM "practice_records";
--> statement-breakpoint
ALTER TABLE "practice_records" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "practice_records" CASCADE;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "check_ins_habit_date_idx" ON "check_ins" USING btree ("habit_id","check_in_date");--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_life_area_id_life_areas_id_fk" FOREIGN KEY ("life_area_id") REFERENCES "public"."life_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "habits_status_life_area_idx" ON "habits" USING btree ("status","life_area_id");--> statement-breakpoint
ALTER TABLE "habits" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "habits" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "habits" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "habits" DROP COLUMN "minimum_action";--> statement-breakpoint
ALTER TABLE "habits" DROP COLUMN "estimated_duration_minutes";--> statement-breakpoint
ALTER TABLE "habits" DROP COLUMN "activated_at";--> statement-breakpoint
ALTER TABLE "habits" DROP COLUMN "paused_at";--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_name_length_check" CHECK (char_length("habits"."name") between 1 and 80);--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_acceptance_criteria_length_check" CHECK (char_length("habits"."acceptance_criteria") between 1 and 500);--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_checkpoints_per_day_check" CHECK ("habits"."checkpoints_per_day" between 1 and 12);--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_checkpoint_labels_check" CHECK ("habits"."checkpoint_labels" is null or cardinality("habits"."checkpoint_labels") = "habits"."checkpoints_per_day");--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_why_length_check" CHECK (char_length("habits"."why") between 1 and 500);--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_trigger_length_check" CHECK (char_length("habits"."trigger") between 1 and 200);--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_weekdays_check" CHECK (cardinality("habits"."weekdays") between 1 and 7 and "habits"."weekdays" <@ array[1,2,3,4,5,6,7]::smallint[]);--> statement-breakpoint
DROP TYPE "public"."habit_category";--> statement-breakpoint
DROP TYPE "public"."practice_outcome";
