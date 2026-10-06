"use client";

import { Spinner } from "@repo/ui";
import type { DocSummary } from "@repo/api/todex";

import { DocRows, docsSectionClassName, filterDocs } from "./doc-collection";
import { DocsCanvasHeader, type DocsCrumb } from "./docs-header";
import { useDocs } from "./docs-provider";

export function DocListPage({
  crumbs,
  folderId = null,
  emptyLabel,
  match,
}: {
  crumbs: DocsCrumb[];
  folderId?: string | null;
  emptyLabel: string;
  match: (doc: DocSummary) => boolean;
}) {
  const {
    state: { docs, search, isLoading },
  } = useDocs();
  const visibleDocs = filterDocs(docs, search).filter(match);

  return (
    <section className={docsSectionClassName()}>
      <DocsCanvasHeader crumbs={crumbs} folderId={folderId} />
      {isLoading ? (
        <Spinner className="flex-1" />
      ) : (
        <DocRows
          docs={visibleDocs}
          emptyLabel={search.trim() ? "Nothing matches this search." : emptyLabel}
        />
      )}
    </section>
  );
}
