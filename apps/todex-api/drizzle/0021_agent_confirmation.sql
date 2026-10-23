ALTER TYPE "public"."agent_job_status" ADD VALUE 'awaiting_confirmation' BEFORE 'completed';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "pending_tool_calls" jsonb;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "confirmation_decision" text;