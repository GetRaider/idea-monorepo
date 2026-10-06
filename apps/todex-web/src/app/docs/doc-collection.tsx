"use client";

import Link from "next/link";
import { DocType } from "@repo/api/todex";
import type { DocSummary } from "@repo/api/todex";
import { cn } from "@repo/ui";

import { useDocs } from "./docs-provider";

export function DocRows({
  docs,
  emptyLabel,
}: {
  docs: DocSummary[];
  emptyLabel: string;
}) {
  const {
    state: { folders },
  } = useDocs();
  const folderNameById = new Map(folders.map((folder) => [folder.id, folder.name]));

  if (docs.length === 0) {
    return <p className="px-2 py-2 text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col">
      {docs.map((doc) => {
        const folderName = doc.folderId
          ? folderNameById.get(doc.folderId)
          : null;
        return (
          <li key={doc.id}>
            <Link
              href={`/docs/${doc.id}`}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-surface"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {doc.docKey}
              </span>
              <span className="min-w-0 flex-1 truncate">{doc.title}</span>
              <span className="max-w-40 truncate text-xs text-muted-foreground">
                {folderName ?? docTypeLabel(doc.type)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function filterDocs(docs: DocSummary[], search: string) {
  const query = search.trim().toLowerCase();
  const matched = query
    ? docs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.docKey.toLowerCase().includes(query),
      )
    : docs;
  return [...matched].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export function docTypeLabel(type: DocSummary["type"]) {
  return type === DocType.GOAL ? "Goal" : "General";
}

export function docsSectionClassName() {
  return cn("flex min-h-0 min-w-0 flex-1 flex-col overflow-auto px-6 pb-6 pt-3");
}
