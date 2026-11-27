ALTER TYPE "public"."counter_period_outcome" RENAME TO "counter_day_outcome";
--> statement-breakpoint
ALTER TABLE "counters" ADD COLUMN "schedule" jsonb;
--> statement-breakpoint
UPDATE "counters" SET
  "schedule" = CASE "frequency"
    WHEN 'daily' THEN jsonb_build_object('frequency', 'daily', 'interval', "interval")
    WHEN 'weekly' THEN jsonb_build_object(
      'frequency', 'weekly',
      'interval', "interval",
      'weekdays', jsonb_build_array(
        (ARRAY['MO','TU','WE','TH','FR','SA','SU'])[EXTRACT(ISODOW FROM "anchor_date")::int]
      )
    )
    ELSE jsonb_build_object('frequency', 'monthly', 'monthDay', EXTRACT(DAY FROM "anchor_date")::int)
  END,
  -- A weekly or monthly Target has no per-day meaning, so those start at one.
  "target" = CASE WHEN "frequency" = 'daily' THEN "target" ELSE 1 END,
  "pending_change" = NULL,
  "closed_through" = GREATEST("closed_through", (now() AT TIME ZONE "time_zone")::date - 1);
--> statement-breakpoint
ALTER TABLE "counters" ALTER COLUMN "schedule" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "counters" DROP COLUMN "frequency";
--> statement-breakpoint
ALTER TABLE "counters" DROP COLUMN "interval";
--> statement-breakpoint
DROP TYPE "public"."counter_frequency";
--> statement-breakpoint
-- Default fails of longer periods cannot be mapped onto single days.
DELETE FROM "counter_occurrences" AS "occurrence"
USING "counter_periods" AS "period"
WHERE "occurrence"."source" = 'system'
  AND "occurrence"."counter_id" = "period"."counter_id"
  AND "occurrence"."local_date" BETWEEN "period"."start_date" AND "period"."end_date"
  AND "period"."start_date" <> "period"."end_date";
--> statement-breakpoint
DELETE FROM "counter_periods" WHERE "start_date" <> "end_date";
--> statement-breakpoint
ALTER TABLE "counter_periods" RENAME TO "counter_days";
--> statement-breakpoint
ALTER TABLE "counter_days" RENAME COLUMN "start_date" TO "local_date";
--> statement-breakpoint
ALTER TABLE "counter_days" DROP COLUMN "end_date";
--> statement-breakpoint
ALTER TABLE "counter_days" ADD COLUMN "required" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER INDEX "counter_periods_counter_start_unique" RENAME TO "counter_days_counter_date_unique";
--> statement-breakpoint
-- Marks left without a day keep their history as days marked by choice.
INSERT INTO "counter_days" (
  "id", "counter_id", "local_date", "required", "target",
  "completed", "skipped", "failed", "outcome", "created_at"
)
SELECT
  gen_random_uuid()::text,
  "occurrence"."counter_id",
  "occurrence"."local_date",
  false,
  "counter"."target",
  count(*) FILTER (WHERE "occurrence"."status" = 'completed'),
  count(*) FILTER (WHERE "occurrence"."status" = 'skipped'),
  count(*) FILTER (WHERE "occurrence"."status" = 'failed'),
  (CASE
    WHEN count(*) FILTER (WHERE "occurrence"."status" = 'failed') > 0 THEN 'failed'
    WHEN count(*) FILTER (WHERE "occurrence"."status" = 'completed') >= "counter"."target" THEN 'met'
    ELSE 'excused'
  END)::"counter_day_outcome",
  now()
FROM "counter_occurrences" AS "occurrence"
JOIN "counters" AS "counter" ON "counter"."id" = "occurrence"."counter_id"
WHERE NOT EXISTS (
  SELECT 1 FROM "counter_days" AS "day"
  WHERE "day"."counter_id" = "occurrence"."counter_id"
    AND "day"."local_date" = "occurrence"."local_date"
)
GROUP BY "occurrence"."counter_id", "occurrence"."local_date", "counter"."target";
