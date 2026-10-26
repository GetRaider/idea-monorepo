ALTER TABLE "epics" ADD COLUMN "section_id" text;
--> statement-breakpoint
UPDATE "epics" AS epic
SET "section_id" = section.id
FROM "space_sections" AS section
WHERE section.space_id = epic.space_id
  AND section.is_default = true
  AND epic.section_id IS NULL;
--> statement-breakpoint
ALTER TABLE "epics" ALTER COLUMN "section_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "epics" ADD CONSTRAINT "epics_section_id_space_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."space_sections"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "epics_section_id_idx" ON "epics" USING btree ("section_id");
