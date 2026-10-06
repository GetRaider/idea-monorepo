ALTER TABLE "workspaces" ADD COLUMN "doc_seq" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "docs" ADD COLUMN "doc_key" text;--> statement-breakpoint
WITH numbered AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "workspace_id"
      ORDER BY "created_at", "id"
    ) AS sequence
  FROM "docs"
)
UPDATE "docs"
SET "doc_key" = 'D-' || numbered.sequence
FROM numbered
WHERE "docs"."id" = numbered."id";--> statement-breakpoint
UPDATE "workspaces"
SET "doc_seq" = (
  SELECT count(*)::integer
  FROM "docs"
  WHERE "docs"."workspace_id" = "workspaces"."id"
);--> statement-breakpoint
ALTER TABLE "docs" ALTER COLUMN "doc_key" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "docs_workspace_doc_key_unique" ON "docs" USING btree ("workspace_id","doc_key");
