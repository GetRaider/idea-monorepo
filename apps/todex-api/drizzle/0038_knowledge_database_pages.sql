ALTER TABLE "knowledge_database_rows"
  ADD COLUMN "content" jsonb NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb;
--> statement-breakpoint
ALTER TABLE "knowledge_database_rows"
  ADD COLUMN "icon" text;
--> statement-breakpoint
ALTER TABLE "knowledge_database_rows"
  ADD COLUMN "cover" text;
--> statement-breakpoint
ALTER TABLE "knowledge_database_rows"
  ADD COLUMN "version" integer NOT NULL DEFAULT 0;
