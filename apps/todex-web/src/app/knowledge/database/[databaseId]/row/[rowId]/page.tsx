"use client";

import { useParams } from "next/navigation";

import { KnowledgeDatabaseRecordPage } from "@/app/knowledge/knowledge-database-record-page";

export default function DatabaseRecordFullPage() {
  const params = useParams<{ databaseId: string; rowId: string }>();
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <KnowledgeDatabaseRecordPage
        key={`${params.databaseId}:${params.rowId}`}
        databaseId={params.databaseId}
        rowId={params.rowId}
      />
    </div>
  );
}
