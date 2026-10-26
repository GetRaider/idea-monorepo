"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DocType } from "@repo/api/todex";
import type { Doc, ProseDoc } from "@repo/api/todex";
import { Button, ConfirmDialog, Spinner } from "@repo/ui";
import { toast } from "sonner";
import { todexClient } from "@lib/todex-client";

import { docsSectionClassName } from "./doc-collection";
import { DocsCanvasHeader, type DocsCrumb } from "./docs-header";
import { useDocs } from "./docs-provider";
import { TaskDescriptionEditor } from "../planning/task-description-editor";

export function DocEditor({ docId }: { docId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    state: { folders },
  } = useDocs();
  const docQuery = useQuery({
    queryKey: ["docs", docId],
    queryFn: () => todexClient.docs.get(docId),
  });
  const [draft, setDraft] = useState<DocDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const skipSaveRef = useRef(true);
  const loadedDocIdRef = useRef<string | null>(null);
  const saveDraftRef = useRef<(next: DocDraft) => void>(() => undefined);
  const doc = docQuery.data;

  useEffect(() => {
    if (doc?.type === DocType.GOAL) {
      router.replace(`/planning/goals/${doc.id}`);
    }
  }, [doc, router]);

  useEffect(() => {
    if (
      !doc ||
      doc.type !== DocType.COMMON ||
      doc.id !== docId ||
      loadedDocIdRef.current === doc.id
    ) {
      return;
    }
    loadedDocIdRef.current = doc.id;
    skipSaveRef.current = true;
    setDraft(draftFromDoc(doc));
  }, [doc, docId]);

  const save = useMutation({
    mutationFn: (next: DocDraft) =>
      todexClient.docs.update(docId, patchFromDraft(next)),
    onSuccess: (updated) => {
      queryClient.setQueryData(["docs", docId], updated);
      void queryClient.invalidateQueries({ queryKey: ["docs"] });
    },
    onError: () => toast.error("Could not save the doc"),
  });
  saveDraftRef.current = save.mutate;

  useEffect(() => {
    if (!draft || !draft.title.trim()) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    const handle = setTimeout(() => {
      saveDraftRef.current(draft);
    }, 400);
    return () => clearTimeout(handle);
  }, [draft]);

  const remove = useMutation({
    mutationFn: () => todexClient.docs.remove(docId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["docs"] });
      router.push("/knowledge");
    },
    onError: () => toast.error("Could not delete the doc"),
  });

  if (docQuery.isError) {
    return (
      <section className={docsSectionClassName()}>
        <p className="text-sm text-muted-foreground">
          This doc is unavailable.
        </p>
      </section>
    );
  }

  if (docQuery.isLoading || !doc || doc.type === DocType.GOAL || !draft) {
    return (
      <section className={docsSectionClassName()}>
        <Spinner className="flex-1" />
      </section>
    );
  }

  return (
    <section className={docsSectionClassName()}>
      <DocsCanvasHeader
        crumbs={crumbsForDoc(doc, folders)}
        showSearch={false}
        showNew={false}
        trailing={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </Button>
        }
      />
      <textarea
        aria-label="Title"
        value={draft.title}
        rows={2}
        className="w-full resize-none bg-transparent text-2xl font-semibold leading-tight text-foreground outline-none"
        onChange={(event) =>
          setDraft((current) =>
            current ? { ...current, title: event.target.value } : current,
          )
        }
      />
      <ProseSection
        label="Description"
        editorKey={`${doc.id}:content`}
        excludeDocId={doc.id}
        document={draft.content}
        onChange={(content) =>
          setDraft((current) => (current ? { ...current, content } : current))
        }
      />
      {confirmDelete ? (
        <ConfirmDialog
          title="Delete doc"
          description={`Delete "${doc.title}"?`}
          confirmLabel="Delete"
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await remove.mutateAsync();
          }}
        />
      ) : null}
    </section>
  );
}

function ProseSection({
  label,
  editorKey,
  excludeDocId,
  document,
  onChange,
}: {
  label: string;
  editorKey: string;
  excludeDocId: string;
  document: ProseDoc;
  onChange: (document: ProseDoc) => void;
}) {
  return (
    <div className="mt-1">
      <p className="mb-3 text-lg font-medium text-muted-foreground">{label}</p>
      <TaskDescriptionEditor
        key={editorKey}
        appearance="plain"
        content=""
        excludeDocId={excludeDocId}
        document={withParagraph(document)}
        onDocumentChange={onChange}
      />
    </div>
  );
}

function withParagraph(document: ProseDoc): ProseDoc {
  if ((document.content ?? []).length > 0) return document;
  return { type: "doc", content: [{ type: "paragraph" }] };
}

function draftFromDoc(
  doc: Extract<Doc, { type: typeof DocType.COMMON }>,
): DocDraft {
  return {
    title: doc.title,
    content: doc.body.content,
  };
}

function patchFromDraft(draft: DocDraft) {
  return {
    title: draft.title.trim(),
    body: { content: draft.content },
  };
}

function crumbsForDoc(
  doc: Doc,
  folders: { id: string; name: string }[],
): DocsCrumb[] {
  const crumbs: DocsCrumb[] = [{ label: "Knowledge", href: "/knowledge" }];
  const folder = doc.folderId
    ? folders.find((item) => item.id === doc.folderId)
    : null;
  if (folder) {
    crumbs.push({
      label: folder.name,
      href: `/knowledge/folder/${folder.id}`,
    });
  } else {
    crumbs.push({ label: "General", href: "/knowledge/general" });
  }
  crumbs.push({ label: doc.docKey });
  return crumbs;
}

interface DocDraft {
  title: string;
  content: ProseDoc;
}
