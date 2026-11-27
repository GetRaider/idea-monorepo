CREATE TABLE "counter_sections" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "position" double precision NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "counter_sections_workspace_id_idx" ON "counter_sections" ("workspace_id");
--> statement-breakpoint
CREATE TABLE "counter_spaces" (
  "counter_id" text NOT NULL REFERENCES "counters"("id") ON DELETE cascade,
  "space_id" text NOT NULL REFERENCES "spaces"("id") ON DELETE cascade,
  "created_at" timestamp NOT NULL,
  CONSTRAINT "counter_spaces_pk" PRIMARY KEY ("counter_id", "space_id")
);
--> statement-breakpoint
CREATE INDEX "counter_spaces_space_id_idx" ON "counter_spaces" ("space_id");
--> statement-breakpoint
ALTER TABLE "counters" ADD COLUMN "section_id" text REFERENCES "counter_sections"("id") ON DELETE set null;
--> statement-breakpoint
CREATE INDEX "counters_section_id_idx" ON "counters" ("section_id");
--> statement-breakpoint
ALTER TABLE "counters" ADD COLUMN "color" text DEFAULT '#B8A4D1' NOT NULL;
--> statement-breakpoint
ALTER TABLE "counters" DROP COLUMN "space_id";
--> statement-breakpoint
ALTER TABLE "counters" RENAME COLUMN "counts_space_tasks" TO "counts_any_task";
--> statement-breakpoint
-- Space settings and picked Tasks from before linked spaces are not carried over.
UPDATE "counters" SET "counts_any_task" = false;
--> statement-breakpoint
DELETE FROM "counter_links";
