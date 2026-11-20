ALTER TABLE "space_folders" ADD COLUMN "position" double precision;--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "position" double precision;--> statement-breakpoint
WITH ordered AS (
	SELECT id, (row_number() OVER (PARTITION BY workspace_id ORDER BY created_at, id) - 1) * 1024 AS pos
	FROM "space_folders"
)
UPDATE "space_folders" AS folder
SET "position" = ordered.pos
FROM ordered
WHERE folder.id = ordered.id;--> statement-breakpoint
WITH folder_counts AS (
	SELECT workspace_id, count(*) AS total
	FROM "space_folders"
	GROUP BY workspace_id
),
ordered AS (
	SELECT space.id,
		(COALESCE(folder_counts.total, 0) + row_number() OVER (PARTITION BY space.workspace_id ORDER BY space.created_at, space.id) - 1) * 1024 AS pos
	FROM "spaces" AS space
	LEFT JOIN folder_counts ON folder_counts.workspace_id = space.workspace_id
	WHERE space.space_folder_id IS NULL AND space.is_inbox = false
)
UPDATE "spaces" AS space
SET "position" = ordered.pos
FROM ordered
WHERE space.id = ordered.id;--> statement-breakpoint
WITH ordered AS (
	SELECT id, (row_number() OVER (PARTITION BY space_folder_id ORDER BY created_at, id) - 1) * 1024 AS pos
	FROM "spaces"
	WHERE space_folder_id IS NOT NULL
)
UPDATE "spaces" AS space
SET "position" = ordered.pos
FROM ordered
WHERE space.id = ordered.id;--> statement-breakpoint
UPDATE "spaces" SET "position" = 0 WHERE "position" IS NULL;--> statement-breakpoint
UPDATE "space_folders" SET "position" = 0 WHERE "position" IS NULL;--> statement-breakpoint
ALTER TABLE "space_folders" ALTER COLUMN "position" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "spaces" ALTER COLUMN "position" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "space_folders" ALTER COLUMN "position" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "spaces" ALTER COLUMN "position" SET NOT NULL;
