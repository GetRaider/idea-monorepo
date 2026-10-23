CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
DELETE FROM "agent_chunks";
--> statement-breakpoint
ALTER TABLE "agent_chunks" ADD COLUMN "embedding" vector(768) NOT NULL;