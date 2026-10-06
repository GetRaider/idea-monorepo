"use client";

import { useState } from "react";
import { DocType } from "@repo/api/todex";
import { Spinner, cn } from "@repo/ui";

import { DocRows, docsSectionClassName, filterDocs } from "./doc-collection";
import { DocsCanvasHeader } from "./docs-header";
import { useDocs } from "./docs-provider";

export default function DocsPage() {
  const {
    state: { docs, search, isLoading },
  } = useDocs();
  const [access, setAccess] = useState<QuickAccess | null>(null);
  const visibleDocs = filterDocs(docs, search);
  const activeAccess = QUICK_ACCESS.find((item) => item.id === access) ?? null;
  const recentDocs = visibleDocs.slice(0, RECENT_LIMIT);

  return (
    <section className={docsSectionClassName()}>
      <DocsCanvasHeader crumbs={[{ label: "Docs" }]} />
      {isLoading ? (
        <Spinner className="flex-1" />
      ) : (
        <div className="flex w-full flex-col gap-8">
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Quick Access
            </h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-2">
              {QUICK_ACCESS.map((item) => {
                const count = visibleDocs.filter((doc) => item.match(doc)).length;
                const selected = access === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full min-w-0 flex-col items-start gap-1 rounded-lg border border-border px-3 py-3 text-left hover:bg-surface",
                      selected && "bg-surface",
                    )}
                    onClick={() =>
                      setAccess((current) => (current === item.id ? null : item.id))
                    }
                  >
                    <span className="w-full truncate text-sm font-medium">
                      {item.label}
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          {activeAccess ? (
            <section>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                {activeAccess.label}
              </h2>
              <DocRows
                docs={visibleDocs.filter((doc) => activeAccess.match(doc))}
                emptyLabel={
                  search.trim()
                    ? "Nothing matches this search."
                    : activeAccess.emptyLabel
                }
              />
            </section>
          ) : null}
          <section>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              Recently Updated
            </h2>
            <DocRows
              docs={recentDocs}
              emptyLabel={
                search.trim() ? "Nothing matches this search." : "No docs yet."
              }
            />
          </section>
        </div>
      )}
    </section>
  );
}

const RECENT_LIMIT = 8;

const QUICK_ACCESS: QuickAccessItem[] = [
  {
    id: "goals",
    label: "Goals",
    emptyLabel: "No goals yet.",
    match: (doc) => doc.type === DocType.GOAL,
  },
  {
    id: "general",
    label: "General",
    emptyLabel: "No docs yet.",
    match: (doc) => doc.type === DocType.COMMON,
  },
];

type QuickAccess = "goals" | "general";

interface QuickAccessItem {
  id: QuickAccess;
  label: string;
  emptyLabel: string;
  match: (doc: { type: string }) => boolean;
}
