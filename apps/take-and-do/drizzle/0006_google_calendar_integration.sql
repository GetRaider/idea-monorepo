-- Custom SQL migration file, put your code below! --
CREATE TABLE IF NOT EXISTS "google_calendar_integration" (
	"user_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"calendar_id" text DEFAULT 'primary' NOT NULL,
	"sync_token" text,
	"last_sync_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "google_calendar_integration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action
);