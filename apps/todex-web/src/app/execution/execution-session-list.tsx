"use client";

import { useState } from "react";
import type { ExecutionSession } from "@repo/api/todex";
import { ConfirmDialog } from "@repo/ui";

import { formatDuration } from "./execution-time";

export function ExecutionSessionList({
  sessions,
  empty,
  onUpdate,
  onDelete,
}: {
  sessions: ExecutionSession[];
  empty: string;
  onUpdate?: (sessionId: string, startedAt: string, endedAt: string) => void;
  onDelete?: (sessionId: string) => void;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <>
      <ol className="flex flex-col">
        {sessions.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            editable={onUpdate != null && onDelete != null}
            onUpdate={onUpdate}
            onDelete={() => setDeleteId(session.id)}
          />
        ))}
      </ol>
      {deleteId ? (
        <ConfirmDialog
          title="Delete execution"
          description="This removes the session and the time it recorded."
          confirmLabel="Delete"
          onConfirm={() => onDelete?.(deleteId)}
          onClose={() => setDeleteId(null)}
        />
      ) : null}
    </>
  );
}

function SessionRow({
  session,
  editable,
  onUpdate,
  onDelete,
}: {
  session: ExecutionSession;
  editable: boolean;
  onUpdate?: (sessionId: string, startedAt: string, endedAt: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [startedAt, setStartedAt] = useState(() =>
    toLocalInput(session.startedAt),
  );
  const [endedAt, setEndedAt] = useState(() =>
    toLocalInput(session.endedAt ?? session.startedAt),
  );
  const ended = new Date(endedAt).getTime();
  const started = new Date(startedAt).getTime();
  const canSave = Number.isFinite(started) && Number.isFinite(ended) && ended > started;

  return (
    <li className="border-b border-border py-3 last:border-b-0">
      <div className="flex items-baseline justify-between gap-4">
        <p className="min-w-0 truncate text-sm">{sessionLabel(session)}</p>
        <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {session.endedAt ? formatDuration(session.duration) : "In progress"}
        </p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        <span suppressHydrationWarning>{formatWhen(session.startedAt)}</span>
        {session.tasks.length > 0
          ? ` · ${session.tasks.map((task) => task.taskKey).join(", ")}`
          : ""}
        {` · ${session.executorType === "ai" ? "AI" : "Human"}`}
      </p>
      {editable ? (
        editing ? (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <TimeField label="Started" value={startedAt} onChange={setStartedAt} />
            <TimeField label="Ended" value={endedAt} onChange={setEndedAt} />
            <button
              type="button"
              className="h-8 rounded-md bg-surface px-3 text-sm disabled:opacity-50"
              disabled={!canSave}
              onClick={() => {
                if (!canSave) return;
                onUpdate?.(
                  session.id,
                  new Date(startedAt).toISOString(),
                  new Date(endedAt).toISOString(),
                );
                setEditing(false);
              }}
            >
              Save
            </button>
            <button
              type="button"
              className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        )
      ) : null}
    </li>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <input
        type="datetime-local"
        value={value}
        className="h-8 rounded-md border border-border bg-transparent px-2 text-sm text-foreground outline-none"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function sessionLabel(session: ExecutionSession) {
  if (session.tasks.length === 0) return "No task";
  return session.tasks.map((task) => task.summary).join(", ");
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toLocalInput(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
