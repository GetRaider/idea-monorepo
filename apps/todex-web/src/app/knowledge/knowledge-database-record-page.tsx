"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { KnowledgeDatabasePage, ProseDoc } from "@repo/api/todex";

import { todexClient } from "@lib/todex-client";
import { KnowledgeContentEditor } from "./knowledge-content-editor";
import { KnowledgeCellEditor } from "./knowledge-database-cell";

type PageUpdate = {
  content?: ProseDoc;
  icon?: string | null;
  cover?: string | null;
};

export function KnowledgeDatabaseRecordPage({
  databaseId,
  rowId,
  mode = "full",
  onClose,
}: {
  databaseId: string;
  rowId: string;
  mode?: "full" | "peek";
  onClose?: () => void;
}) {
  const client = useQueryClient();
  const queryKey = ["knowledge-database-page", databaseId, rowId];
  const pageQuery = useQuery({
    queryKey,
    queryFn: () => todexClient.knowledgeDatabases.getRowPage(databaseId, rowId),
  });
  const [draft, setDraft] = useState<ProseDoc | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "editing" | "saving" | "error" | "conflict">("saved");
  const loadedRef = useRef<string | null>(null);
  const draftRef = useRef<ProseDoc | null>(null);
  const savedContentRef = useRef("");
  const queuedContentRef = useRef("");
  const versionRef = useRef(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const page = pageQuery.data;

  useEffect(() => {
    if (!page || loadedRef.current === `${databaseId}:${rowId}`) return;
    loadedRef.current = `${databaseId}:${rowId}`;
    draftRef.current = page.content;
    setDraft(page.content);
    savedContentRef.current = JSON.stringify(page.content);
    queuedContentRef.current = "";
    versionRef.current = page.version;
    setSaveStatus("saved");
  }, [page, databaseId, rowId]);

  const enqueue = useCallback((patch: PageUpdate) => {
    setSaveStatus("saving");
    saveQueueRef.current = saveQueueRef.current.catch(() => undefined).then(async () => {
      try {
        const next = await todexClient.knowledgeDatabases.updateRowPage(databaseId, rowId, {
          ...patch, expectedVersion: versionRef.current,
        });
        versionRef.current = next.version;
        if (patch.content) savedContentRef.current = JSON.stringify(patch.content);
        client.setQueryData<KnowledgeDatabasePage>(queryKey, next);
        if (patch.icon !== undefined || patch.cover !== undefined) {
          void client.invalidateQueries({ queryKey: ["knowledge-database", databaseId] });
        }
        setSaveStatus(JSON.stringify(draftRef.current) === savedContentRef.current
          ? "saved" : "editing");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to save this page";
        queuedContentRef.current = "";
        setSaveStatus(/changed elsewhere|conflict|409/i.test(message) ? "conflict" : "error");
        toast.error(message);
        throw error;
      }
    });
    return saveQueueRef.current;
  }, [client, databaseId, rowId]);

  useEffect(() => {
    if (!draft || !page || saveStatus === "conflict" || saveStatus === "error") return;
    const signature = JSON.stringify(draft);
    if (signature === savedContentRef.current || signature === queuedContentRef.current) return;
    const handle = window.setTimeout(() => {
      queuedContentRef.current = signature;
      void enqueue({ content: draft }).catch(() => undefined);
    }, 650);
    return () => window.clearTimeout(handle);
  }, [draft, page, enqueue, saveStatus]);

  const saveNow = useCallback(() => {
    const current = draftRef.current;
    if (!current || JSON.stringify(current) === savedContentRef.current) return saveQueueRef.current;
    queuedContentRef.current = JSON.stringify(current);
    return enqueue({ content: current });
  }, [enqueue]);

  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (draftRef.current && JSON.stringify(draftRef.current) !== savedContentRef.current) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("beforeunload", unload);
      if (draftRef.current && JSON.stringify(draftRef.current) !== savedContentRef.current) {
        void saveNow().catch(() => undefined);
      }
    };
  }, [saveNow]);

  if (pageQuery.isLoading) {
    return <div className="px-6 py-12 text-sm text-muted-foreground">Loading page…</div>;
  }
  if (pageQuery.isError || !page) {
    return <div className="p-8 text-sm text-muted-foreground">Page unavailable or access denied.</div>;
  }

  const titleProperty = page.properties.find((property) => property.type === "title");
  const title = titleProperty ? String(page.row.cells[titleProperty.id] || "") : "";
  const pageUrl = `/knowledge/database/${encodeURIComponent(databaseId)}/row/${encodeURIComponent(rowId)}`;

  async function updateCell(propertyId: string, value: string | number | boolean | string[] | null) {
    try {
      const result = await todexClient.knowledgeDatabases.patchCell(databaseId, rowId, {
        propertyId, value,
      });
      client.setQueryData(["knowledge-database", databaseId], result);
      void client.invalidateQueries({ queryKey });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update property");
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col text-foreground">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-6 py-3">
        <div className="min-w-0 truncate text-xs text-muted-foreground">Knowledge / {title || "Untitled"}</div>
        <div className="flex shrink-0 items-center gap-3">
          <span role="status" className="text-xs text-muted-foreground">
            {saveStatus === "saved" ? "Saved" :
              saveStatus === "saving" ? "Saving…" :
              saveStatus === "editing" ? "Unsaved" :
              saveStatus === "conflict" ? "Conflict — reload required" : "Save failed"}
          </span>
          {saveStatus !== "saved" && saveStatus !== "conflict" ? (
            <button type="button" className="rounded px-2 py-1 text-xs hover:bg-surface"
              onClick={() => void saveNow().catch(() => undefined)}>Save</button>
          ) : null}
          {mode === "peek" ? (
            <Link href={pageUrl} className="rounded px-2 py-1 text-xs hover:bg-surface">
              Open full page
            </Link>
          ) : (
            <Link href="/knowledge" className="rounded px-2 py-1 text-xs hover:bg-surface">
              Knowledge
            </Link>
          )}
          {onClose ? (
            <button type="button" onClick={() => {
              void saveNow().then(() => onClose()).catch(() => undefined);
            }} className="rounded px-2 py-1 text-xs hover:bg-surface">
              Close
            </button>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-24">
        <div className="mx-auto w-full max-w-[800px] pt-10">
          {page.cover ? (
            <div className="mb-6 h-36 rounded-lg bg-cover bg-center"
              role="img" aria-label="Page cover" style={{ backgroundImage: `url("${page.cover.replace(/["\\]/g, "")}")` }} />
          ) : null}
          <div className="mb-4 flex items-center gap-2">
            <input className="w-16 rounded bg-transparent text-3xl outline-none"
              aria-label="Page icon" title="Page icon" maxLength={16}
              placeholder="📄" value={page.icon ?? ""}
              onChange={(event) => {
                client.setQueryData<KnowledgeDatabasePage>(queryKey, {
                  ...page, icon: event.target.value || null,
                });
              }}
              onBlur={() => { void enqueue({ icon: page.icon }).catch(() => undefined); }}
            />
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                const url = window.prompt("Cover image HTTPS URL", page.cover ?? "");
                if (url === null) return;
                void enqueue({ cover: url || null }).catch(() => undefined);
              }}>{page.cover ? "Change cover" : "Add cover"}</button>
          </div>

          <input aria-label="Page title" className="mb-6 w-full bg-transparent text-4xl font-bold leading-tight outline-none placeholder:text-muted-foreground"
            placeholder="Untitled" key={`${rowId}:${title}`} defaultValue={title}
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (titleProperty && value !== title) void updateCell(titleProperty.id, value);
            }}
            onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />

          <div className="mb-8 flex flex-col gap-1">
            {page.properties.filter((property) => property.type !== "title").map((property) => (
              <div key={property.id} className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-2 rounded py-1 text-sm hover:bg-surface/30">
                <div className="truncate px-2 text-xs text-muted-foreground">{property.name}</div>
                <KnowledgeCellEditor
                  property={property}
                  value={page.row.cells[property.id] ?? null}
                  disabled={false}
                  onSave={(value) => { void updateCell(property.id, value); }}
                />
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            {draft ? (
              <KnowledgeContentEditor
                docId={`database-row:${databaseId}:${rowId}`}
                spaceId={page.spaceId}
                document={draft}
                onChange={(content) => {
                  draftRef.current = content;
                  setDraft(content);
                  setSaveStatus("editing");
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
