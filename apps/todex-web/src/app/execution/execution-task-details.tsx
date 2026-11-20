"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEstimation, parseEstimation, TaskStatus } from "@repo/api/todex";
import type { ExecutionCurrent, Task } from "@repo/api/todex";
import { buttonVariants, Checkbox, cn } from "@repo/ui";
import { toast } from "sonner";

import { ChevronIcon, ExternalLinkIcon, LinkIcon } from "@components/icons";
import { todexClient } from "@lib/todex-client";
import { tasksUrlHelper } from "@/helpers/tasks-url.helper";

import { PriorityMenu, StatusMenu, PriorityGlyph, StatusGlyph } from "../planning/task-board.ui";
import { EstimatePicker } from "../planning/task-pickers";
import { TaskDescriptionEditor } from "../planning/task-description-editor";
import {
  isClosedStatus,
  statusAfterDoneToggle,
  taskProgressPercent,
} from "../planning/task-helpers";

export function ExecutionTaskDetails({ task }: { task: ExecutionCurrent }) {
  const queryClient = useQueryClient();
  const boardTasks = useQuery({
    queryKey: ["tasks", "execution-space", task.spaceId],
    queryFn: () => todexClient.tasks.list({ spaceId: task.spaceId }),
  });
  const loaded =
    (boardTasks.data ?? []).find((item) => item.id === task.id) ?? null;
  const subtasks = (boardTasks.data ?? []).filter(
    (item) => item.parentTaskId === task.id,
  );
  const criteria = loaded?.acceptanceCriteria ?? task.acceptanceCriteria;
  const parent = loaded?.parentTaskId
    ? (boardTasks.data ?? []).find((item) => item.id === loaded.parentTaskId)
    : null;
  const planningHref = tasksUrlHelper.routing.buildBoardUrl(
    task.spaceId,
    task.taskKey,
    parent?.taskKey,
  );
  const progress = taskProgressPercent({
    status: task.status,
    acceptanceCriteria: criteria,
    subtasks: subtasks.length > 0 ? subtasks : task.subtasks,
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["execution"] });
    void queryClient.invalidateQueries({
      queryKey: ["tasks", "execution-space", task.spaceId],
    });
  }

  const subtaskCount =
    subtasks.length > 0 ? subtasks.length : task.subtasks.length;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#141414] px-5 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium tracking-[0.16em] text-[#8d8d8a]">
            EXECUTION TASK
          </p>
          <div className="mt-2 flex min-w-0 items-center gap-3">
            <StatusMenu
              large
              status={loaded?.status ?? task.status}
              onSelect={(status) => {
                if (!loaded || status === loaded.status) return;
                void saveTaskStatus(loaded, status).then(refresh, () =>
                  toast.error("Could not update the task"),
                );
              }}
            />
            <PriorityMenu
              priority={loaded?.priority ?? task.priority}
              onSelect={(priority) => {
                if (!loaded || priority === loaded.priority) return;
                void todexClient.tasks.update(loaded.id, {
                  priority,
                  version: loaded.version,
                }).then(refresh, () => toast.error("Could not update task priority"));
              }}
            />
            <h3
              className={cn(
                "min-w-0 truncate text-2xl font-semibold leading-none text-[#f2f2f0]",
                isClosedStatus(task.status) && "text-[#8f8f8c] line-through",
              )}
            >
              {task.summary}
            </h3>
            <Link
              href={planningHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "shrink-0",
              )}
            >
              <ExternalLinkIcon size={14} />
              Open Task
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ProgressRing progress={progress} />
          <div className="h-12 w-px bg-white/10" />
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <p className="text-[11px] font-medium tracking-[0.16em] text-[#8d8d8a]">
              TASK ESTIMATE
            </p>
            <p className="mt-1 text-2xl font-semibold leading-none text-[#f2f2f0]">
              {formatEstimation(task.estimation) || "—"}
            </p>
          </div>
        </div>
      </div>
      <DescriptionSection task={loaded} />
      <div className="mt-4 grid border-t border-white/10 pt-4 md:grid-cols-2">
        <div className="md:pr-6">
          <h4 className="mb-3 text-lg font-semibold text-[#f2f2f0]">
            Acceptance criteria ({criteria.length})
          </h4>
          {loaded ? (
            <CriteriaList task={loaded} criteria={criteria} onSaved={refresh} />
          ) : (
            <p className="text-sm text-[#8f8f8c]">Loading criteria…</p>
          )}
        </div>
        <div className="mt-6 border-t border-white/10 pt-6 md:mt-0 md:border-t-0 md:border-l md:pl-6 md:pt-0">
          <h4 className="mb-3 text-lg font-semibold text-[#f2f2f0]">
            Subtasks ({subtaskCount})
          </h4>
          {subtaskCount === 0 ? (
            <p className="text-sm text-[#8f8f8c]">No subtasks.</p>
          ) : (
            <ul className="flex flex-col">
              {subtasks.map((subtask) => (
                <SubtaskRow
                  key={subtask.id}
                  subtask={subtask}
                  parentTaskKey={task.taskKey}
                  onSaved={refresh}
                />
              ))}
              {subtasks.length === 0
                ? task.subtasks.map((subtask) => (
                    <li
                      key={subtask.id}
                      className="py-1.5 text-sm text-[#d7d7d4]"
                    >
                      <span className="flex items-center gap-2">
                        <StatusGlyph status={subtask.status} />
                        <PriorityGlyph priority={subtask.priority} />
                        <span className="min-w-0 flex-1 truncate">{subtask.summary}</span>
                        <span className="text-xs text-[#8f8f8c]">{formatEstimation(subtask.estimation)}</span>
                      </span>
                    </li>
                  ))
                : null}
            </ul>
          )}
        </div>
      </div>
      <References taskId={task.id} />
    </section>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = Math.max(0, Math.min(1, progress)) * circumference;

  return (
    <div className="relative flex size-20 items-center justify-center">
      <svg
        viewBox="0 0 72 72"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="5"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="#f2f2f0"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 36 36)"
        />
      </svg>
      <span className="text-sm font-medium text-[#f2f2f0]">
        {Math.round(progress * 100)}%
      </span>
    </div>
  );
}

function DescriptionSection({ task }: { task: Task | null }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <button
        type="button"
        className="flex items-center gap-1.5 text-lg font-semibold text-[#f2f2f0]"
        onClick={() => setOpen((current) => !current)}
      >
        <ChevronIcon
          size={16}
          className={cn("transition-transform", open ? "rotate-90" : "")}
        />
        Description
      </button>
      {open ? (
        <div className="mt-2 pl-5">
          {task ? (
            <DescriptionField task={task} />
          ) : (
            <p className="text-sm text-[#8f8f8c]">Loading description…</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

async function saveTaskStatus(task: Task, status: Task["status"]) {
  const closing =
    (status === TaskStatus.DONE || status === TaskStatus.CANCELLED) &&
    status !== task.status;
  if (closing) await todexClient.execution.release({ taskId: task.id });
  await todexClient.tasks.update(task.id, {
    status,
    version: task.version,
    ...(closing ? { transitionId: crypto.randomUUID() } : {}),
  });
}

function DescriptionField({ task }: { task: Task }) {
  const queryClient = useQueryClient();
  const timer = useRef<number | null>(null);
  const update = useMutation({
    mutationFn: (html: string) =>
      todexClient.tasks.update(task.id, {
        description: html,
        version: task.version,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["execution"] });
      void queryClient.invalidateQueries({
        queryKey: ["tasks", "execution-space", task.spaceId],
      });
    },
    onError: () => toast.error("Could not save the description"),
  });

  useEffect(
    () => () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    },
    [],
  );

  return (
    <TaskDescriptionEditor
      content={task.description}
      appearance="field"
      onChange={(html) => {
        if (html === task.description) return;
        if (timer.current != null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => update.mutate(html), 500);
      }}
    />
  );
}

function SubtaskRow({
  subtask,
  parentTaskKey,
  onSaved,
}: {
  subtask: Task;
  parentTaskKey: string;
  onSaved: () => void;
}) {
  const [estimationText, setEstimationText] = useState(formatEstimation(subtask.estimation));

  useEffect(() => {
    setEstimationText(formatEstimation(subtask.estimation));
  }, [subtask.estimation]);

  const update = useMutation({
    mutationFn: async (patch: Partial<Pick<Task, "status" | "priority" | "estimation">>) => {
      if (patch.status !== undefined) {
        await saveTaskStatus(subtask, patch.status);
      } else {
        await todexClient.tasks.update(subtask.id, {
          ...patch,
          version: subtask.version,
        });
      }
    },
    onSuccess: onSaved,
    onError: () => {
      setEstimationText(formatEstimation(subtask.estimation));
      toast.error("Could not update the subtask");
    },
  });

  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1.5 py-2 text-sm">
      <StatusMenu
        status={subtask.status}
        onSelect={(status) => {
          if (!update.isPending && status !== subtask.status) update.mutate({ status });
        }}
      />
      <PriorityMenu
        priority={subtask.priority}
        onSelect={(priority) => {
          if (!update.isPending && priority !== subtask.priority) update.mutate({ priority });
        }}
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          subtask.status === TaskStatus.DONE
            ? "text-[#8f8f8c] line-through"
            : "text-[#f2f2f0]",
        )}
        title={subtask.summary}
      >
        {subtask.summary}
      </span>
      <span className="shrink-0 text-xs text-[#8f8f8c]">{subtask.taskKey}</span>
      <EstimatePicker
        appearance="plain"
        value={estimationText}
        onChange={setEstimationText}
        onCommit={(value) => {
          const estimation = parseEstimation(value);
          if (estimation == null || estimation <= 0) {
            setEstimationText(formatEstimation(subtask.estimation));
            return;
          }
          if (estimation !== subtask.estimation && !update.isPending) {
            update.mutate({ estimation });
          }
        }}
      />
      <Link
        href={tasksUrlHelper.routing.buildBoardUrl(subtask.spaceId, subtask.taskKey, parentTaskKey)}
        aria-label={`Open subtask ${subtask.summary} in Planning`}
        title="Open subtask in Planning"
        className="shrink-0 text-[#8f8f8c] hover:text-[#f2f2f0]"
      >
        <ExternalLinkIcon size={14} />
      </Link>
    </li>
  );
}

function CriteriaList({
  task,
  criteria,
  onSaved,
}: {
  task: Task;
  criteria: Task["acceptanceCriteria"];
  onSaved: () => void;
}) {
  const update = useMutation({
    mutationFn: (next: Task["acceptanceCriteria"]) =>
      todexClient.tasks.update(task.id, {
        acceptanceCriteria: next,
        version: task.version,
      }),
    onSuccess: onSaved,
    onError: () => toast.error("Could not update acceptance criteria"),
  });

  if (criteria.length === 0) {
    return <p className="text-sm text-[#8f8f8c]">No acceptance criteria.</p>;
  }

  return (
    <ul className="flex flex-col">
      {criteria.map((criterion) => (
        <li key={criterion.id} className="flex items-center gap-2.5 py-1.5">
          <Checkbox
            checked={criterion.done}
            aria-label={`Mark ${criterion.text} done`}
            onCheckedChange={(checked) =>
              update.mutate(
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
              "text-sm",
              criterion.done ? "text-[#8f8f8c] line-through" : "text-[#f2f2f0]",
            )}
          >
            {criterion.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function References({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const references = useQuery({
    queryKey: ["task-references", taskId],
    queryFn: () => todexClient.tasks.references.list(taskId),
  });
  const createReference = useMutation({
    mutationFn: () =>
      todexClient.tasks.references.create(taskId, {
        kind: "url",
        url,
        ...(title.trim() ? { title: title.trim() } : {}),
      }),
    onSuccess: () => {
      setTitle("");
      setUrl("");
      void queryClient.invalidateQueries({
        queryKey: ["task-references", taskId],
      });
    },
    onError: () => toast.error("Could not add the reference"),
  });

  const items = references.data ?? [];

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <h4 className="mb-3 text-lg font-semibold text-[#f2f2f0]">
        References ({items.length})
      </h4>
      {items.length === 0 ? (
        <p className="mb-2 text-sm text-[#8f8f8c]">No references.</p>
      ) : (
        <ul className="mb-2 flex flex-col">
          {items.map((reference) => (
            <li
              key={reference.id}
              className="flex items-center gap-2 py-1.5 text-sm text-[#d7d7d4]"
            >
              <LinkIcon size={14} className="shrink-0 text-[#8d8d8a]" />
              <span className="min-w-0 flex-1 truncate">{reference.title}</span>
              {reference.url ? (
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${reference.title}`}
                  className="text-[#8d8d8a] hover:text-[#f2f2f0]"
                >
                  <ExternalLinkIcon size={14} />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 ? (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!url.trim()) return;
            createReference.mutate();
          }}
        >
          <input
            aria-label="Reference title"
            value={title}
            placeholder="Title"
            className="h-8 rounded-md border border-white/10 bg-transparent px-2 text-sm text-[#f2f2f0] outline-none"
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            aria-label="Reference URL"
            value={url}
            placeholder="https://"
            className="h-8 min-w-40 flex-1 rounded-md border border-white/10 bg-transparent px-2 text-sm text-[#f2f2f0] outline-none"
            onChange={(event) => setUrl(event.target.value)}
          />
          <button
            type="submit"
            className="h-8 rounded-md border border-white/10 px-3 text-sm text-[#e6e6e3] hover:bg-white/10"
          >
            Add
          </button>
        </form>
      ) : null}
    </div>
  );
}
