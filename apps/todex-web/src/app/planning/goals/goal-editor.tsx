"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { DocType, GoalStatus } from "@repo/api/todex";
import type {
  AcceptanceCriterion,
  GoalDoc,
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
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { todexClient } from "@lib/todex-client";
import { docsSectionClassName } from "../../knowledge/doc-collection";
import { DocsBreadcrumb } from "../../knowledge/docs-header";
import { TaskDescriptionEditor } from "../task-description-editor";
import { goalProgress, goalProgressLabel } from "./goal-progress";

export function GoalEditor({ goalId }: { goalId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const goalQuery = useQuery({
    queryKey: ["docs", goalId],
    queryFn: () => todexClient.docs.get(goalId),
  });
  const [draft, setDraft] = useState<GoalDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const skipSaveRef = useRef(true);
  const loadedGoalIdRef = useRef<string | null>(null);
  const saveDraftRef = useRef<(next: GoalDraft) => void>(() => undefined);
  const goal = goalQuery.data?.type === DocType.GOAL ? goalQuery.data : null;

  useEffect(() => {
    if (!goal || goal.id !== goalId || loadedGoalIdRef.current === goal.id)
      return;
    loadedGoalIdRef.current = goal.id;
    skipSaveRef.current = true;
    setDraft(draftFromGoal(goal));
  }, [goal, goalId]);

  const save = useMutation({
    mutationFn: (next: GoalDraft) =>
      todexClient.docs.update(goalId, patchFromDraft(next)),
    onSuccess: (updated) => {
      queryClient.setQueryData(["docs", goalId], updated);
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
    mutationFn: () => todexClient.docs.remove(goalId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["docs"] });
      router.push("/planning/goals");
    },
    onError: () => toast.error("Could not delete the doc"),
  });

  if (
    goalQuery.isError ||
    (goalQuery.data && goalQuery.data.type !== DocType.GOAL)
  ) {
    return (
      <section className={docsSectionClassName()}>
        <p className="text-sm text-muted-foreground">
          This goal is unavailable.
        </p>
      </section>
    );
  }

  if (goalQuery.isLoading || !goal || !draft) {
    return (
      <section className={docsSectionClassName()}>
        <Spinner className="flex-1" />
      </section>
    );
  }

  return (
    <section className={docsSectionClassName()}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <DocsBreadcrumb
          className="flex-none"
          crumbs={[
            { label: "Planning", href: "/planning" },
            { label: "Goals", href: "/planning/goals" },
            { label: draft.title.trim() || "Untitled" },
          ]}
        />
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0"
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </Button>
      </div>
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
      <GoalFields goalId={goal.id} draft={draft} onChange={setDraft} />
      {confirmDelete ? (
        <ConfirmDialog
          title="Delete goal"
          description={`Delete "${goal.title}"?`}
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

function GoalFields({
  goalId,
  draft,
  onChange,
}: {
  goalId: string;
  draft: GoalDraft;
  onChange: (update: (current: GoalDraft | null) => GoalDraft | null) => void;
}) {
  const tasksQuery = useQuery({
    queryKey: ["tasks", "workspace"],
    queryFn: listWorkspaceTasks,
  });
  const spacesQuery = useQuery({
    queryKey: ["spaces"],
    queryFn: () => todexClient.spaces.list(),
  });
  const tasks = tasksQuery.data ?? [];
  const spaceNameById = new Map(
    (spacesQuery.data ?? []).map((space) => [space.id, space.name]),
  );
  const linked = draft.linkedTaskIds.flatMap((taskId) => {
    const task = tasks.find((item) => item.id === taskId);
    return task ? [task] : [];
  });
  const available = tasks.filter(
    (task) => !draft.linkedTaskIds.includes(task.id),
  );
  const progress = tasksQuery.isSuccess
    ? goalProgress(linked.map((task) => task.status))
    : null;
  const spaceIds = [
    ...new Set(linked.flatMap((task) => (task.epicId ? [task.spaceId] : []))),
  ];
  const epicQueries = useQueries({
    queries: spaceIds.map((spaceId) => ({
      queryKey: ["epics", spaceId],
      queryFn: () => todexClient.epics.list(spaceId),
    })),
  });
  const epicById = new Map(
    epicQueries
      .flatMap((query) => query.data ?? [])
      .map((epic) => [epic.id, epic]),
  );
  const relatedEpics = relatedEpicsFor(linked, spaceNameById, epicById);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-end gap-6">
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Status
          <Select
            value={draft.status}
            onValueChange={(status) => {
              if (!isGoalStatus(status)) return;
              onChange((current) =>
                current ? { ...current, status } : current,
              );
            }}
          >
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {GOAL_STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Deadline
          <input
            type="date"
            aria-label="Deadline"
            value={draft.deadline ?? ""}
            className="h-9 rounded-md border border-border bg-transparent px-2 text-sm text-foreground outline-none"
            onChange={(event) =>
              onChange((current) =>
                current
                  ? { ...current, deadline: event.target.value || null }
                  : current,
              )
            }
          />
        </label>
        <p className="pb-2 text-sm text-muted-foreground">
          {progress ? `Progress ${goalProgressLabel(progress)}` : "Progress"}
        </p>
      </div>
      <ProseSection
        label="Description"
        editorKey={`${goalId}:why`}
        excludeDocId={goalId}
        document={draft.why}
        onChange={(why) =>
          onChange((current) => (current ? { ...current, why } : current))
        }
      />
      <CriteriaSection
        label="Success criteria"
        addLabel="Add success criterion"
        placeholder="Add criterion"
        criteria={draft.successCriteria}
        onChange={(successCriteria) =>
          onChange((current) =>
            current ? { ...current, successCriteria } : current,
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
            current ? { ...current, preconditions } : current,
          )
        }
      />
      <section className="mt-6">
        <p className="mb-3 text-lg font-medium text-muted-foreground">
          Linked tasks
        </p>
        {linked.length > 0 ? (
          <ul className="mb-3 flex flex-col">
            {linked.map((task) => {
              const href = taskHref(task, spaceNameById);
              return (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {task.taskKey}
                  </span>
                  {href ? (
                    <Link
                      href={href}
                      className="min-w-0 flex-1 truncate hover:underline"
                    >
                      {task.summary}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1 truncate">
                      {task.summary}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Unlink ${task.taskKey}`}
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      onChange((current) =>
                        current
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
              );
            })}
          </ul>
        ) : null}
        {available.length > 0 ? (
          <TaskLinkSelect
            tasks={available}
            onLink={(taskId) =>
              onChange((current) =>
                current
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
      <section className="mt-6">
        <p className="mb-3 text-lg font-medium text-muted-foreground">
          Related epics
        </p>
        {relatedEpics.length > 0 ? (
          <ul className="flex flex-col">
            {relatedEpics.map((epic) => (
              <li key={epic.id}>
                <Link
                  href={epic.href}
                  className="block rounded-md px-2 py-2 text-sm hover:bg-surface"
                >
                  {epic.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 text-sm text-muted-foreground">
            No related epics.
          </p>
        )}
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
    <div className="mt-6">
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
      <p className="mb-3 text-lg font-medium text-muted-foreground">{label}</p>
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

function relatedEpicsFor(
  tasks: Task[],
  spaceNameById: Map<string, string>,
  epicById: Map<string, { id: string; name: string }>,
) {
  const seen = new Set<string>();
  return tasks.flatMap((task) => {
    if (!task.epicId || seen.has(task.epicId)) return [];
    const epic = epicById.get(task.epicId);
    const spaceName = spaceNameById.get(task.spaceId);
    if (!epic || !spaceName) return [];
    seen.add(task.epicId);
    return [
      {
        id: epic.id,
        name: epic.name,
        href: tasksUrlHelper.routing.buildEpicUrl(spaceName, epic.id),
      },
    ];
  });
}

function taskHref(task: Task, spaceNameById: Map<string, string>) {
  const spaceName = spaceNameById.get(task.spaceId);
  if (!spaceName) return null;
  return tasksUrlHelper.routing.buildBoardUrl(spaceName, task.taskKey);
}

async function listWorkspaceTasks() {
  const boards = await todexClient.spaces.list();
  const groups = await Promise.all(
    boards.map((board) => todexClient.tasks.list({ spaceId: board.id })),
  );
  return groups.flat();
}

function withParagraph(document: ProseDoc): ProseDoc {
  if ((document.content ?? []).length > 0) return document;
  return { type: "doc", content: [{ type: "paragraph" }] };
}

function draftFromGoal(goal: GoalDoc): GoalDraft {
  return {
    title: goal.title,
    why: goal.body.why,
    successCriteria: goal.body.successCriteria,
    preconditions: goal.body.preconditions,
    status: goal.body.status,
    deadline: goal.body.deadline,
    linkedTaskIds: goal.linkedTaskIds,
  };
}

function patchFromDraft(draft: GoalDraft) {
  return {
    title: draft.title.trim(),
    body: {
      why: draft.why,
      successCriteria: draft.successCriteria,
      preconditions: draft.preconditions,
      status: draft.status,
      deadline: draft.deadline,
    },
    linkedTaskIds: draft.linkedTaskIds,
  };
}

const GOAL_STATUS_OPTIONS = [
  GoalStatus.ACTIVE,
  GoalStatus.PAUSED,
  GoalStatus.DONE,
] as const;

function isGoalStatus(value: string): value is GoalStatus {
  return GOAL_STATUS_OPTIONS.some((status) => status === value);
}

const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  [GoalStatus.ACTIVE]: "Active",
  [GoalStatus.PAUSED]: "Paused",
  [GoalStatus.DONE]: "Done",
};

interface GoalDraft {
  title: string;
  why: ProseDoc;
  successCriteria: AcceptanceCriterion[];
  preconditions: AcceptanceCriterion[];
  status: GoalStatus;
  deadline: string | null;
  linkedTaskIds: string[];
}
