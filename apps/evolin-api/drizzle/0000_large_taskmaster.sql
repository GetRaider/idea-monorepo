CREATE TYPE "public"."habit_category" AS ENUM('health', 'mind', 'work', 'home', 'relationships', 'learning', 'other');--> statement-breakpoint
CREATE TYPE "public"."habit_status" AS ENUM('backlog', 'establishing', 'paused', 'established');--> statement-breakpoint
CREATE TYPE "public"."practice_outcome" AS ENUM('completed', 'skipped');--> statement-breakpoint
CREATE TABLE "habit_status_events" (
	"id" text PRIMARY KEY NOT NULL,
	"habit_id" text NOT NULL,
	"from_status" "habit_status",
	"to_status" "habit_status" NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" "habit_category" NOT NULL,
	"why" text,
	"minimum_action" text,
	"trigger" text,
	"weekdays" smallint[],
	"estimated_duration_minutes" smallint,
	"status" "habit_status" DEFAULT 'backlog' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"established_at" timestamp with time zone,
	CONSTRAINT "habits_title_length_check" CHECK (char_length("habits"."title") between 1 and 80),
	CONSTRAINT "habits_description_length_check" CHECK ("habits"."description" is null or char_length("habits"."description") <= 500),
	CONSTRAINT "habits_why_length_check" CHECK ("habits"."why" is null or char_length("habits"."why") between 1 and 500),
	CONSTRAINT "habits_minimum_action_length_check" CHECK ("habits"."minimum_action" is null or char_length("habits"."minimum_action") between 1 and 200),
	CONSTRAINT "habits_trigger_length_check" CHECK ("habits"."trigger" is null or char_length("habits"."trigger") between 1 and 200),
	CONSTRAINT "habits_duration_check" CHECK ("habits"."estimated_duration_minutes" is null or "habits"."estimated_duration_minutes" between 1 and 180),
	CONSTRAINT "habits_weekdays_check" CHECK ("habits"."weekdays" is null or (
        cardinality("habits"."weekdays") between 1 and 7
        and "habits"."weekdays" <@ array[1,2,3,4,5,6,7]::smallint[]
      )),
	CONSTRAINT "habits_complete_plan_check" CHECK ("habits"."status" = 'backlog' or (
        "habits"."why" is not null
        and "habits"."minimum_action" is not null
        and "habits"."trigger" is not null
        and "habits"."weekdays" is not null
        and "habits"."estimated_duration_minutes" is not null
      ))
);
--> statement-breakpoint
CREATE TABLE "practice_records" (
	"habit_id" text NOT NULL,
	"practice_date" date NOT NULL,
	"outcome" "practice_outcome" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practice_records_habit_id_practice_date_pk" PRIMARY KEY("habit_id","practice_date")
);
--> statement-breakpoint
ALTER TABLE "habit_status_events" ADD CONSTRAINT "habit_status_events_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_records" ADD CONSTRAINT "practice_records_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "habit_status_events_habit_occurred_idx" ON "habit_status_events" USING btree ("habit_id","occurred_at");--> statement-breakpoint
CREATE INDEX "habits_status_updated_idx" ON "habits" USING btree ("status","updated_at");