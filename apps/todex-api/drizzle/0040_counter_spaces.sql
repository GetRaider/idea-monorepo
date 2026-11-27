ALTER TABLE "counters" ADD COLUMN "space_id" text REFERENCES "spaces"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "counters" ADD COLUMN "counts_space_tasks" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE INDEX "counters_space_id_idx" ON "counters" ("space_id");
