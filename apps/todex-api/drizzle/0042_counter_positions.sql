ALTER TABLE "counters" ADD COLUMN "position" double precision DEFAULT 0 NOT NULL;
--> statement-breakpoint
-- Existing Counters keep the order they were listed in: oldest first.
UPDATE "counters" SET "position" = "ordered"."rank" * 1024
FROM (
  SELECT "id", row_number() OVER (
    PARTITION BY "workspace_id" ORDER BY "created_at", "id"
  ) - 1 AS "rank"
  FROM "counters"
) AS "ordered"
WHERE "counters"."id" = "ordered"."id";
