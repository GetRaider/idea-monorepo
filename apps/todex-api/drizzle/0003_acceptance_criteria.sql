ALTER TABLE "tasks" ADD COLUMN "acceptance_criteria" jsonb DEFAULT '[]'::jsonb NOT NULL;
