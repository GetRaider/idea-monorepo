"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { formatEstimation } from "@repo/api/todex";
import type { ExecutionCurrent } from "@repo/api/todex";

import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { formatDuration } from "./execution-time";
import { STATUS_LABEL } from "../tasks/task-helpers";

export function ExecutionTaskDetail({ task }: { task: ExecutionCurrent }) {
  const taskHref = tasksUrlHelper.routing.buildBoardUrl(
    task.boardName,
    task.taskKey,
  );
  const description = hasText(task.description) ? task.description : null;

  return (
    <div className="flex flex-col gap-5 border-t border-border pt-5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Detail label="Board" value={task.boardName} />
        <Detail label="Estimate" value={formatEstimation(task.estimation)} />
        <Detail label="Executed" value={formatDuration(task.actualTime)} />
        <Detail
          label="Goal"
          value={
            task.goal ? (
              <Link href={`/docs/${task.goal.id}`} className="hover:underline">
                {task.goal.title}
              </Link>
            ) : (
              "None"
            )
          }
        />
        <Detail label="Status" value={STATUS_LABEL[task.status]} />
      </dl>
      <section>
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">
          Acceptance criteria
        </h3>
        {task.acceptanceCriteria.length === 0 ? (
          <p className="text-sm text-muted-foreground">None</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {task.acceptanceCriteria.map((criterion) => (
              <li key={criterion.id} className="text-sm">
                <span className="mr-2 text-muted-foreground">
                  {criterion.done ? "✓" : "○"}
                </span>
                <span className={criterion.done ? "text-muted-foreground line-through" : undefined}>
                  {criterion.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">
          Subtasks
        </h3>
        {task.subtasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">None</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {task.subtasks.map((subtask) => (
              <li key={subtask.id} className="truncate text-sm">
                <span className="text-muted-foreground">{subtask.taskKey}</span>{" "}
                {subtask.summary}
                <span className="text-muted-foreground">
                  {" "}
                  · {STATUS_LABEL[subtask.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {description ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            Description
          </summary>
          <div
            className="prose-sm mt-2 max-w-none text-sm text-foreground [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </details>
      ) : null}
      <Link
        href={taskHref}
        className="text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        Open task
      </Link>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function hasText(html: string) {
  return html.replace(/<[^>]*>/g, " ").trim().length > 0;
}
