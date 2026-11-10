"use client";

import { useState, type ReactNode } from "react";
import { Button, Checkbox, Input, Label, Textarea } from "@repo/ui";
import {
  formatTaskRecurrence,
  type CalendarEvent,
  type CalendarRsvpStatus,
  type TaskRecurrence,
} from "@repo/api/todex";

import { TaskRecurrencePicker } from "../planning/task-recurrence-picker";
import { deviceTimeZone, withAllDay } from "./calendar-datetime";
import { useCalendar, type CalendarComposer } from "./calendar-provider";
import { TaskScopePicker } from "./calendar-task-scope";
import { CalendarWhenFields } from "./calendar-when";

export function CalendarEventView() {
  const {
    state: { selectedEvent, composer },
  } = useCalendar();
  if (composer) return <CreateEventEditor key={composerKey(composer)} draft={composer} />;
  if (!selectedEvent) return null;
  return <EventEditor key={selectedEvent.id} event={selectedEvent} />;
}

function EventEditor({ event }: { event: CalendarEvent }) {
  const {
    state: { occurrence, tasks, boards },
    actions: { closeEvent, updateEvent, removeEvent },
  } = useCalendar();
  const locked = !event.organizerSelf;
  const [title, setTitle] = useState(event.title);
  const [allDay, setAllDay] = useState(event.allDay);
  const [start, setStart] = useState(event.start);
  const [end, setEnd] = useState(event.end);
  const [spaceId, setSpaceId] = useState<string | null>(event.spaceId);
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(event.recurrence);
  const [participants, setParticipants] = useState(event.participants.join(", "));
  const [description, setDescription] = useState(event.description);
  const [taskScope, setTaskScope] = useState(event.taskScope);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeZone = event.timeZone || deviceTimeZone();
  const emails = participants
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  const emailsValid = emails.every((email) => email.includes("@"));
  const dirty =
    title.trim() !== event.title ||
    allDay !== event.allDay ||
    start !== event.start ||
    end !== event.end ||
    spaceId !== event.spaceId ||
    JSON.stringify(recurrence) !== JSON.stringify(event.recurrence) ||
    description !== event.description ||
    JSON.stringify(taskScope) !== JSON.stringify(event.taskScope) ||
    emails.join(",") !== event.participants.join(",");
  const canSave = Boolean(
    !locked &&
      dirty &&
      title.trim() &&
      Date.parse(start) < Date.parse(end) &&
      emailsValid,
  );

  function changeAllDay(next: boolean) {
    const range = withAllDay(start, end, next);
    setAllDay(next);
    setStart(range.start);
    setEnd(range.end);
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">Event</span>
        <Button type="button" size="sm" variant="ghost" onClick={closeEvent}>
          Close
        </Button>
      </div>
      <form
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3"
        onSubmit={(submitEvent) => {
          submitEvent.preventDefault();
          if (!canSave) return;
          setError(null);
          setPending(true);
          const instance = Boolean(occurrence && (event.recurrence || event.rawRrule));
          void updateEvent(event.id, {
            title: title.trim(),
            start,
            end,
            allDay,
            spaceId,
            timeZone,
            ...(event.rawRrule ? {} : { recurrence }),
            description,
            taskScope,
            participants: emails,
            ...(instance
              ? { scope: "instance", originalStart: occurrence }
              : { scope: "series" }),
          })
            .catch(() => setError("Could not save the event"))
            .finally(() => setPending(false));
        }}
      >
        <Input
          value={title}
          disabled={locked}
          aria-label="Title"
          onChange={(input) => setTitle(input.target.value)}
        />
        <SpaceSelect
          boards={boards}
          spaceId={spaceId}
          disabled={locked}
          tasksSelected={taskScope.length > 0}
          onChange={(next) => {
            if (taskScope.length > 0 && next !== spaceId) {
              if (!window.confirm("Changing space clears the selected tasks.")) return;
              setTaskScope([]);
            }
            setSpaceId(next);
          }}
        />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={allDay}
            disabled={locked}
            onCheckedChange={(checked) => changeAllDay(checked === true)}
          />
          All day
        </label>
        <CalendarWhenFields
          allDay={allDay}
          start={start}
          end={end}
          disabled={locked}
          onStart={setStart}
          onEnd={setEnd}
        />
        <Field label="Repeat">
          {locked || event.rawRrule ? (
            <p className="text-sm">
              {event.rawRrule
                ? "Custom repeat from Google Calendar"
                : event.recurrence
                  ? formatTaskRecurrence(event.recurrence)
                  : "Doesn't repeat"}
            </p>
          ) : (
            <TaskRecurrencePicker
              recurrence={recurrence}
              scheduleDate={start}
              dueDate={null}
              detail=""
              onChange={setRecurrence}
            />
          )}
        </Field>
        <div className="flex gap-1">
          {RSVP_OPTIONS.map((option) => (
            <Button
              key={option.status}
              type="button"
              size="sm"
              variant={event.rsvpStatus === option.status ? "solid" : "ghost"}
              onClick={() => saveRsvp(option.status)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Field label="Participants">
          <Input
            value={participants}
            disabled={locked}
            placeholder="name@email.com, …"
            onChange={(input) => setParticipants(input.target.value)}
          />
        </Field>
        <Field label="Task scope">
          <TaskScopePicker
            boards={boards}
            tasks={tasks}
            value={taskScope}
            selection="multiple"
            spaceId={spaceId}
            disabled={locked}
            onChange={setTaskScope}
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={description}
            disabled={locked}
            rows={5}
            onChange={(input) => setDescription(input.target.value)}
          />
        </Field>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {emailsValid ? null : (
          <p className="text-xs text-destructive">Participants need an email address.</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pb-8 pt-4">
          {locked ? null : (
            <Button type="button" size="sm" variant="ghost" onClick={closeEvent}>
              Cancel
            </Button>
          )}
          {locked ? null : (
            <Button
              type="submit"
              size="sm"
              variant="solid"
              disabled={!canSave || pending}
            >
              Save
            </Button>
          )}
          {locked ? null : occurrence && (event.recurrence || event.rawRrule) ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => void removeEvent(event.id, "instance", occurrence)}
            >
              Delete this
            </Button>
          ) : null}
          {locked ? null : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                void removeEvent(
                  event.id,
                  event.recurrence || event.rawRrule ? "series" : undefined,
                )
              }
            >
              {event.recurrence || event.rawRrule ? "Delete series" : "Delete"}
            </Button>
          )}
        </div>
      </form>
    </aside>
  );

  function saveRsvp(status: CalendarRsvpStatus) {
    void updateEvent(event.id, {
      rsvpStatus: event.rsvpStatus === status ? null : status,
      ...(occurrence && (event.recurrence || event.rawRrule)
        ? { scope: "instance", originalStart: occurrence }
        : {}),
    });
  }
}

function CreateEventEditor({ draft }: { draft: CalendarComposer }) {
  const {
    state: { tasks, boards },
    actions: { closeComposer, createEvent, updateTask },
  } = useCalendar();
  const [kind, setKind] = useState(draft.kind);
  const [title, setTitle] = useState(draft.title);
  const [taskId, setTaskId] = useState(draft.taskId);
  const [allDay, setAllDay] = useState(draft.allDay);
  const [start, setStart] = useState(draft.start);
  const [end, setEnd] = useState(draft.end);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null);
  const [participants, setParticipants] = useState("");
  const [description, setDescription] = useState("");
  const [taskScope, setTaskScope] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeZone = deviceTimeZone();
  const emails = participants
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  const emailsValid = emails.every((email) => email.includes("@"));
  const canCreate =
    Date.parse(start) < Date.parse(end) &&
    emailsValid &&
    (kind === "event" ? title.trim().length > 0 : Boolean(taskId));

  function changeAllDay(next: boolean) {
    const range = withAllDay(start, end, next);
    setAllDay(next);
    setStart(range.start);
    setEnd(range.end);
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {kind === "task" ? "New task" : "New event"}
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={closeComposer}>
          Close
        </Button>
      </div>
      <form
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3"
        onSubmit={(submitEvent) => {
          submitEvent.preventDefault();
          if (!canCreate) return;
          setError(null);
          setPending(true);
          const request =
            kind === "task"
              ? updateTask(taskId, {
                  scheduleDate: start,
                  ...(allDay
                    ? {}
                    : {
                        estimation: Math.max(
                          15,
                          Math.round((Date.parse(end) - Date.parse(start)) / 60_000),
                        ),
                      }),
                })
              : createEvent({
                  title: title.trim(),
                  start,
                  end,
                  allDay,
                  spaceId,
                  timeZone,
                  recurrence,
                  description,
                  taskScope,
                  participants: emails,
                });
          void request
            .then(() => closeComposer())
            .catch(() => setError("Could not create the event"))
            .finally(() => setPending(false));
        }}
      >
        <Field label="Type">
          <select
            aria-label="Type"
            value={kind}
            className="h-9 w-full rounded-md border border-border bg-transparent px-2 text-sm"
            onChange={(event) => setKind(event.target.value === "task" ? "task" : "event")}
          >
            <option value="event">Event</option>
            <option value="task">Task</option>
          </select>
        </Field>
        {kind === "event" ? (
          <>
            <Input
              value={title}
              aria-label="Title"
              placeholder="Event title"
              onChange={(input) => setTitle(input.target.value)}
            />
            <SpaceSelect
              boards={boards}
              spaceId={spaceId}
              tasksSelected={taskScope.length > 0}
              onChange={(next) => {
                if (taskScope.length > 0 && next !== spaceId) {
                  if (!window.confirm("Changing space clears the selected tasks.")) return;
                  setTaskScope([]);
                }
                setSpaceId(next);
              }}
            />
          </>
        ) : (
          <Field label="Task">
            <TaskScopePicker
              boards={boards}
              tasks={tasks}
              value={taskId ? [taskId] : []}
              selection="single"
              onChange={(taskIds) => setTaskId(taskIds[0] ?? "")}
            />
          </Field>
        )}
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={allDay}
            onCheckedChange={(checked) => changeAllDay(checked === true)}
          />
          All day
        </label>
        <CalendarWhenFields
          allDay={allDay}
          start={start}
          end={end}
          onStart={setStart}
          onEnd={setEnd}
        />
        {kind === "event" ? (
          <>
            <Field label="Repeat">
              <TaskRecurrencePicker
                recurrence={recurrence}
                scheduleDate={start}
                dueDate={null}
                detail=""
                onChange={setRecurrence}
              />
            </Field>
            <Field label="Participants">
              <Input
                value={participants}
                placeholder="name@email.com, …"
                onChange={(input) => setParticipants(input.target.value)}
              />
            </Field>
            <Field label="Task scope">
              <TaskScopePicker
                boards={boards}
                tasks={tasks}
                value={taskScope}
                selection="multiple"
                spaceId={spaceId}
                onChange={setTaskScope}
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={description}
                rows={5}
                onChange={(input) => setDescription(input.target.value)}
              />
            </Field>
          </>
        ) : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {emailsValid ? null : (
          <p className="text-xs text-destructive">Participants need an email address.</p>
        )}
        <div className="mt-auto flex items-center gap-2 pb-8 pt-4">
          <Button type="button" size="sm" variant="ghost" onClick={closeComposer}>
            Cancel
          </Button>
          <Button type="submit" size="sm" variant="solid" disabled={!canCreate || pending}>
            Create
          </Button>
        </div>
      </form>
    </aside>
  );
}

function composerKey(draft: CalendarComposer) {
  return `${draft.kind}:${draft.start}:${draft.end}:${draft.taskId}:${draft.title}`;
}

function SpaceSelect({
  boards,
  spaceId,
  disabled,
  tasksSelected,
  onChange,
}: {
  boards: { id: string; name: string }[];
  spaceId: string | null;
  disabled?: boolean;
  tasksSelected: boolean;
  onChange: (spaceId: string | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      Space
      <select
        aria-label="Space"
        disabled={disabled}
        value={spaceId ?? ""}
        className="h-9 w-full rounded-md border border-border bg-transparent px-2 text-sm"
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="" disabled={tasksSelected}>
          No space
        </option>
        {boards.map((board) => (
          <option key={board.id} value={board.id}>
            {board.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

const RSVP_OPTIONS: { status: CalendarRsvpStatus; label: string }[] = [
  { status: "yes", label: "Yes" },
  { status: "no", label: "No" },
  { status: "maybe", label: "Maybe" },
];
