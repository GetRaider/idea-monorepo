ALTER TABLE "tasks" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH "ranked" AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "task_board_id", "status"
      ORDER BY "created_at" ASC, "id" ASC
    ) - 1 AS "pos"
  FROM "tasks"
  WHERE "parent_task_id" IS NULL
)
UPDATE "tasks"
SET "position" = "ranked"."pos"
FROM "ranked"
WHERE "tasks"."id" = "ranked"."id";
