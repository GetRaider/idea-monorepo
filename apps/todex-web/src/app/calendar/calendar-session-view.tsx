"use client";

import { useState } from "react";
import { Button, Input } from "@repo/ui";
import type { ExecutionCalendar } from "@repo/api/todex";

import {
  formatSliceRange,
  sessionDisplayTitle,
  splitIntervalAtLocalMidnight,
  unionDurationSeconds,
} from "./calendar-actual";
import { deviceTimeZone } from "./calendar-datetime";
import { useCalendar } from "./calendar-provider";

export function CalendarSessionView() {
  const {
    state: { selectedSessionId, sessions },
    actions: { closeSession },
  } = useCalendar();
  const session = sessions.find((item) => item.id === selectedSessionId);
  if (!session) return null;
  return (
    <SessionEditor
      key={`${session.id}:${session.title ?? ""}`}
      session={session}
      onClose={closeSession}
    />
  );
}

function SessionEditor({
  session,
  onClose,
}: {
  session: ExecutionCalendar["sessions"][number];
  onClose: () => void;
}) {
  const {
    actions: { updateSessionTitle },
  } = useCalendar();
  const [title, setTitle] = useState(session.title ?? "");
  const [pending, setPending] = useState(false);
  const now = new Date();
  const timeZone = deviceTimeZone();
  const pieces = session.slices.flatMap((slice) =>
    splitIntervalAtLocalMidnight(slice, timeZone, now),
  );
  const seconds = unionDurationSeconds(session.slices, now);

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">Session</span>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <form
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          void updateSessionTitle(session.id, title.trim())
            .catch(() => undefined)
            .finally(() => setPending(false));
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          Title
          <Input
            value={title}
            aria-label="Session title"
            placeholder={sessionDisplayTitle({ title: null, tasks: session.tasks })}
            onChange={(input) => setTitle(input.target.value)}
          />
        </label>
        <p className="text-sm">{session.spaceName}</p>
        <ul className="flex flex-col gap-1">
          {session.tasks.map((task) => (
            <li key={task.id} className="text-sm">
              <span className="text-muted-foreground">{task.taskKey}</span> {task.summary}
            </li>
          ))}
        </ul>
        <ul className="flex flex-col gap-1 text-sm tabular-nums">
          {pieces.map((piece) => (
            <li key={`${piece.start.toISOString()}:${piece.end.toISOString()}`}>
              {formatSliceRange(piece.start, piece.end)}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">{formatDuration(seconds)}</p>
        <Button type="submit" size="sm" variant="solid" disabled={pending} className="w-fit">
          Save title
        </Button>
      </form>
    </aside>
  );
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
