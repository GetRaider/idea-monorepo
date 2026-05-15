-- Custom SQL migration file, put your code below! --
DO $$ BEGIN
 CREATE TYPE "public"."calendar_event_type" AS ENUM('common', 'timeBlock');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "calendar_event_type" NOT NULL,
	"title" text NOT NULL,
	"start" timestamp NOT NULL,
	"end" timestamp NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"color" text,
	"extra" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
