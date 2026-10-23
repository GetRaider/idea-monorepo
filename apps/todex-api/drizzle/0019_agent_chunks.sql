CREATE TYPE "public"."agent_source_type" AS ENUM('doc', 'task');--> statement-breakpoint
CREATE TABLE "agent_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"position" integer NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"source_type" "agent_source_type" NOT NULL,
	"source_id" text NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_chunks" ADD CONSTRAINT "agent_chunks_document_id_agent_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."agent_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_documents" ADD CONSTRAINT "agent_documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_chunks_document_position_unique" ON "agent_chunks" USING btree ("document_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_documents_source_unique" ON "agent_documents" USING btree ("workspace_id","source_type","source_id");