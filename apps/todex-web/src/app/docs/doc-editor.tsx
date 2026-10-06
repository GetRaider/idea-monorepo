"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DocType } from "@repo/api/todex";
import type {
  AcceptanceCriterion,
  Doc,
  ProseDoc,
  Task,
} from "@repo/api/todex";
import {
  Button,
  Checkbox,
  ConfirmDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  cn,
} from "@repo/ui";
import { toast } from "sonner";

import { CloseIcon, PlusIcon } from "@components/icons";
import { todexClient } from "@lib/todex-client";

import { docsSectionClassName } from "./doc-collection";
import { DocsCanvasHeader, type DocsCrumb } from "./docs-header";
import { useDocs } from "./docs-provider";
import { TaskDescriptionEditor } from "../tasks/task-description-editor";

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
    if (!doc || doc.id !== docId || loadedDocIdRef.current === doc.id) return;
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
      router.push("/docs");
    },
    onError: () => toast.error("Could not delete the doc"),
  });

  if (docQuery.isError) {
    return (
      <section className={docsSectionClassName()}>
        <p className="text-sm text-muted-foreground">This doc is unavailable.</p>
      </section>
    );
  }

  if (docQuery.isLoading || !doc || !draft) {
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
      {draft.type === DocType.COMMON ? (
        <ProseSection
          label="Description"
          editorKey={`${doc.id}:content`}
          excludeDocId={doc.id}
          document={draft.content}
          onChange={(content) =>
            setDraft((current) =>
              current && current.type === DocType.COMMON
                ? { ...current, content }
                : current,
            )
          }
        />
      ) : (
        <GoalSections
          docId={doc.id}
          draft={draft}
          onChange={setDraft}
        />
      )}
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

function GoalSections({
  docId,
  draft,
  onChange,
}: {
  docId: string;
  draft: GoalDraft;
  onChange: (update: (current: DocDraft | null) => DocDraft | null) => void;
}) {
  const tasksQuery = useQuery({
    queryKey: ["tasks", "workspace"],
    queryFn: listWorkspaceTasks,
  });
  const tasks = tasksQuery.data ?? [];
  const linked = draft.linkedTaskIds.flatMap((taskId) => {
    const task = tasks.find((item) => item.id === taskId);
    return task ? [task] : [];
  });
  const available = tasks.filter((task) => !draft.linkedTaskIds.includes(task.id));

  return (
    <>
      <ProseSection
        label="Why"
        editorKey={`${docId}:why`}
        excludeDocId={docId}
        document={draft.why}
        onChange={(why) =>
          onChange((current) =>
            current && current.type === DocType.GOAL ? { ...current, why } : current,
          )
        }
      />
      <CriteriaSection
        label="Success criteria"
        addLabel="Add success criterion"
        placeholder="Add criterion"
        criteria={draft.successCriteria}
        onChange={(successCriteria) =>
          onChange((current) =>
            current && current.type === DocType.GOAL
              ? { ...current, successCriteria }
              : current,
          )
        }
      />
      <CriteriaSection
        label="Preconditions"
        addLabel="Add precondition"
        placeholder="Add precondition"
        criteria={draft.preconditions}
        onChange={(preconditions) =>
          onChange((current) =>
            current && current.type === DocType.GOAL
              ? { ...current, preconditions }
              : current,
          )
        }
      />
      <section className="mt-6">
        <p className="mb-3 text-lg font-medium text-muted-foreground">
          Linked tasks
        </p>
        {linked.length > 0 ? (
          <ul className="mb-3 flex flex-col">
            {linked.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {task.taskKey}
                </span>
                <span className="min-w-0 flex-1 truncate">{task.summary}</span>
                <button
                  type="button"
                  aria-label={`Unlink ${task.taskKey}`}
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    onChange((current) =>
                      current && current.type === DocType.GOAL
                        ? {
                            ...current,
                            linkedTaskIds: current.linkedTaskIds.filter(
                              (taskId) => taskId !== task.id,
                            ),
                          }
                        : current,
                    )
                  }
                >
                  <CloseIcon size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {available.length > 0 ? (
          <TaskLinkSelect
            tasks={available}
            onLink={(taskId) =>
              onChange((current) =>
                current && current.type === DocType.GOAL
                  ? {
                      ...current,
                      linkedTaskIds: [...current.linkedTaskIds, taskId],
                    }
                  : current,
              )
            }
          />
        ) : null}
      </section>
    </>
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

function CriteriaSection({
  label,
  addLabel,
  placeholder,
  criteria,
  onChange,
}: {
  label: string;
  addLabel: string;
  placeholder: string;
  criteria: AcceptanceCriterion[];
  onChange: (criteria: AcceptanceCriterion[]) => void;
}) {
  const [text, setText] = useState("");

  return (
    <section className="mt-6">
      <p className="mb-3 text-lg font-medium text-muted-foreground">
        {label}
      </p>
      {criteria.length > 0 ? (
        <ul className="mb-3 flex flex-col gap-2">
          {criteria.map((criterion) => (
            <li key={criterion.id} className="flex items-center gap-2">
              <Checkbox
                checked={criterion.done}
                aria-label={`Mark "${criterion.text}" done`}
                onCheckedChange={(checked) =>
                  onChange(
                    criteria.map((item) =>
                      item.id === criterion.id
                        ? { ...item, done: checked === true }
                        : item,
                    ),
                  )
                }
              />
              <span
                className={cn(
                  "min-w-0 flex-1 text-sm",
                  criterion.done && "text-muted-foreground line-through",
                )}
              >
                {criterion.text}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = text.trim();
          if (!trimmed) return;
          onChange([
            ...criteria,
            { id: crypto.randomUUID(), text: trimmed, done: false },
          ]);
          setText("");
        }}
      >
        <PlusIcon size={14} className="shrink-0 text-muted-foreground" />
        <input
          aria-label={addLabel}
          value={text}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          onChange={(event) => setText(event.target.value)}
        />
      </form>
    </section>
  );
}

function TaskLinkSelect({
  tasks,
  onLink,
}: {
  tasks: Task[];
  onLink: (taskId: string) => void;
}) {
  const [generation, setGeneration] = useState(0);
  return (
    <Select
      key={generation}
      onValueChange={(taskId) => {
        onLink(taskId);
        setGeneration((current) => current + 1);
      }}
    >
      <SelectTrigger className="h-9 w-full max-w-md">
        <SelectValue placeholder="Link a task" />
      </SelectTrigger>
      <SelectContent>
        {tasks.map((task) => (
          <SelectItem key={task.id} value={task.id}>
            {task.taskKey} {task.summary}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

async function listWorkspaceTasks() {
  const boards = await todexClient.boards.list();
  const groups = await Promise.all(
    boards.map((board) => todexClient.tasks.list({ boardId: board.id })),
  );
  return groups.flat();
}

function withParagraph(document: ProseDoc): ProseDoc {
  if ((document.content ?? []).length > 0) return document;
  return { type: "doc", content: [{ type: "paragraph" }] };
}

function draftFromDoc(doc: Doc): DocDraft {
  if (doc.type === DocType.COMMON) {
    return {
      type: DocType.COMMON,
      title: doc.title,
      content: doc.body.content,
    };
  }
  return {
    type: DocType.GOAL,
    title: doc.title,
    why: doc.body.why,
    successCriteria: doc.body.successCriteria,
    preconditions: doc.body.preconditions,
    linkedTaskIds: doc.linkedTaskIds,
  };
}

function patchFromDraft(draft: DocDraft) {
  if (draft.type === DocType.COMMON) {
    return {
      title: draft.title.trim(),
      body: { content: draft.content },
    };
  }
  return {
    title: draft.title.trim(),
    body: {
      why: draft.why,
      successCriteria: draft.successCriteria,
      preconditions: draft.preconditions,
    },
    linkedTaskIds: draft.linkedTaskIds,
  };
}

function crumbsForDoc(
  doc: Doc,
  folders: { id: string; name: string }[],
): DocsCrumb[] {
  const crumbs: DocsCrumb[] = [{ label: "Docs", href: "/docs" }];
  const folder = doc.folderId
    ? folders.find((item) => item.id === doc.folderId)
    : null;
  if (folder) {
    crumbs.push({
      label: folder.name,
      href: `/docs/folder/${folder.id}`,
    });
  } else if (doc.type === DocType.GOAL) {
    crumbs.push({ label: "Goals", href: "/docs/goals" });
  } else {
    crumbs.push({ label: "General", href: "/docs/general" });
  }
  crumbs.push({ label: doc.docKey });
  return crumbs;
}

type DocDraft = CommonDraft | GoalDraft;

interface CommonDraft {
  type: typeof DocType.COMMON;
  title: string;
  content: ProseDoc;
}

interface GoalDraft {
  type: typeof DocType.GOAL;
  title: string;
  why: ProseDoc;
  successCriteria: AcceptanceCriterion[];
  preconditions: AcceptanceCriterion[];
  linkedTaskIds: string[];
}
