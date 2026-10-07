CREATE TYPE "public"."calendar_rsvp_status" AS ENUM('yes', 'no', 'maybe');--> statement-breakpoint
CREATE TABLE "calendar_event_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"title" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"task_scope" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"series_event_id" text,
	"title" text NOT NULL,
	"start" timestamp NOT NULL,
	"end" timestamp NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"color" text,
	"time_zone" text NOT NULL,
	"recurrence" jsonb,
	"raw_rrule" text,
	"description" text DEFAULT '' NOT NULL,
	"task_scope" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"participants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rsvp_status" "calendar_rsvp_status",
	"google_event_id" text,
	"google_etag" text,
	"google_updated_at" timestamp,
	"organizer_self" boolean DEFAULT true NOT NULL,
	"original_start" timestamp,
	"cancelled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_calendar_integrations" (
	"user_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"calendar_id" text DEFAULT 'primary' NOT NULL,
	"sync_token" text,
	"last_sync_at" timestamp,
	"last_error" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_event_templates" ADD CONSTRAINT "calendar_event_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_series_event_id_calendar_events_id_fk" FOREIGN KEY ("series_event_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_calendar_integrations" ADD CONSTRAINT "google_calendar_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_events_workspace_start_idx" ON "calendar_events" USING btree ("workspace_id","start");--> statement-breakpoint
CREATE INDEX "calendar_events_series_event_id_idx" ON "calendar_events" USING btree ("series_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "calendar_events_workspace_google_event_unique" ON "calendar_events" USING btree ("workspace_id","google_event_id") WHERE "calendar_events"."google_event_id" is not null;