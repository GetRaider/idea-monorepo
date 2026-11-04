CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"calendar_enabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;