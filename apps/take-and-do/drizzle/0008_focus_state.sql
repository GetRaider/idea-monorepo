CREATE TABLE IF NOT EXISTS "focus_state" (
	"user_id" text PRIMARY KEY NOT NULL,
	"sessions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"backlog" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "focus_state" ADD CONSTRAINT "focus_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
