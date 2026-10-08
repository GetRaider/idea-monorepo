"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskStatus, type Task } from "@repo/api/todex";
import { Checkbox, Spinner, buttonVariants, cn } from "@repo/ui";
import { toast } from "sonner";

import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { todexClient } from "@lib/todex-client";

import { eventBlocks, type CalendarBlock } from "../calendar/calendar-blocks";
import { useExecution } from "../execution/execution-provider";
import { formatClock, formatDuration } from "../execution/execution-time";
import { docTypeLabel } from "../docs/doc-collection";
import {
  isoToLocalTimeInput,
  localDayScheduleQuery,
  statusAfterDoneToggle,
} from "../tasks/task-helpers";
import { OVERVIEW_CHAPTERS } from "./overview-chapters";
import {
  ORGANIZING_PREVIEW_LIMIT,
  RECENT_DOCS_LIMIT,
  UPCOMING_PREVIEW_LIMIT,
  localDayKey,
  localDays,
  organizingTasks,
  overviewTasks,
  upcomingBounds,
} from "./overview-day";

export function OverviewSections() {
  return (
    <>
      <TodaySection />
      <ContinueWorkSection />
      <UpcomingSection />
      <NeedsOrganizingSection />
      <RecentDocsSection />
    </>
  );
}

function TodaySection() {
  const range = localDayScheduleQuery(0);
  const from = new Date(range.scheduleFrom);
  const to = new Date(range.scheduleTo);
  const tasksQuery = useQuery({
    queryKey: ["tasks", "schedule", range.scheduleFrom, range.scheduleTo],
    queryFn: () => todexClient.tasks.list(range),
  });
  const eventsQuery = useQuery({
    queryKey: ["calendar-events", range.scheduleFrom, range.scheduleTo],
    queryFn: () =>
      todexClient.calendar.events.list({
        from: range.scheduleFrom,
        to: range.scheduleTo,
      }),
  });
  const toggleDone = useToggleTaskDone();
  const tasks = overviewTasks(tasksQuery.data ?? []);
  const events = sortEvents(eventBlocks(eventsQuery.data ?? [], from, to));

  return (
    <Section id={OVERVIEW_CHAPTERS[0].id} title="Today">
      <Panel
        title="Tasks"
        href={tasksUrlHelper.routing.buildScheduleUrl("today")}
      >
        <QueryState
          isLoading={tasksQuery.isPending}
          isError={tasksQuery.isError}
          empty={tasks.length === 0}
          emptyLabel="No tasks scheduled."
        >
          <TaskRows
            tasks={tasks}
            hrefFor={(task) => taskHref(task, "today", EMPTY_BOARDS)}
            onToggleDone={(task) => toggleDone.mutate(task)}
          />
        </QueryState>
      </Panel>
      <Panel title="Events" href="/calendar">
        <QueryState
          isLoading={eventsQuery.isPending}
          isError={eventsQuery.isError}
          empty={events.length === 0}
          emptyLabel="No events scheduled."
        >
          <EventRows events={events} />
        </QueryState>
      </Panel>
    </Section>
  );
}

function ContinueWorkSection() {
  const {
    state: { session, focused, isPending, isError },
    meta: { shownSeconds },
  } = useExecution();
  const sessionsQuery = useQuery({
    queryKey: ["execution", "sessions"],
    queryFn: () => todexClient.execution.sessions(),
    enabled: !isPending && !isError && session == null,
  });
  const recent = session == null ? (sessionsQuery.data?.[0] ?? null) : null;
  const waiting = isPending || (session == null && !isError && sessionsQuery.isPending);
  const failed = isError || (session == null && sessionsQuery.isError);
  const hasWork = session != null || recent != null;

  return (
    <Section
      id={OVERVIEW_CHAPTERS[1].id}
      title="Continue Work"
      action={
        hasWork ? (
          <Link
            href="/execution/current"
            className={buttonVariants({ size: "sm" })}
          >
            Continue
          </Link>
        ) : null
      }
    >
      <div className="px-4 py-3">
        {waiting ? (
          <Spinner className="py-2" />
        ) : failed ? (
          <p className="text-sm text-muted-foreground">
            Could not load execution.
          </p>
        ) : session ? (
          <div className="flex items-baseline justify-between gap-4">
            <p className="min-w-0 truncate text-sm">
              {focused?.summary ?? "Active execution"}
            </p>
            {shownSeconds == null ? null : (
              <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatClock(shownSeconds)}
              </p>
            )}
          </div>
        ) : recent ? (
          <div className="flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm">{sessionSummary(recent.tasks)}</p>
              <p className="text-xs text-muted-foreground">
                {formatWhen(recent.startedAt)}
              </p>
            </div>
            <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {recent.endedAt ? formatDuration(recent.duration) : "In progress"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No execution yet.</p>
        )}
      </div>
    </Section>
  );
}

function UpcomingSection() {
  const bounds = upcomingBounds(new Date());
  const from = bounds.from.toISOString();
  const to = bounds.to.toISOString();
  const tasksQuery = useQuery({
    queryKey: ["tasks", "schedule", from, to],
    queryFn: () =>
      todexClient.tasks.list({ scheduleFrom: from, scheduleTo: to }),
  });
  const eventsQuery = useQuery({
    queryKey: ["calendar-events", from, to],
    queryFn: () => todexClient.calendar.events.list({ from, to }),
  });
  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: () => todexClient.boards.list(),
  });
  const toggleDone = useToggleTaskDone();
  const tasks = overviewTasks(tasksQuery.data ?? []);
  const events = sortEvents(
    eventBlocks(eventsQuery.data ?? [], bounds.from, bounds.to),
  );
  const boardNameById = new Map(
    (boardsQuery.data ?? []).map((board) => [board.id, board.name]),
  );
  const taskDays = dayGroups(bounds.from, bounds.to, tasks, []);
  const eventDays = dayGroups(bounds.from, bounds.to, [], events);

  return (
    <Section id={OVERVIEW_CHAPTERS[2].id} title="Upcoming">
      <Panel title="Tasks" href={tasksUrlHelper.routing.buildScheduleUrl("tomorrow")}>
        <QueryState
          isLoading={tasksQuery.isPending}
          isError={tasksQuery.isError}
          empty={taskDays.length === 0}
          emptyLabel="No upcoming tasks."
        >
          <DayList
            days={taskDays}
            tomorrow={bounds.from}
            boardNameById={boardNameById}
            onToggleDone={(task) => toggleDone.mutate(task)}
          />
        </QueryState>
      </Panel>
      <Panel title="Events" href="/calendar">
        <QueryState
          isLoading={eventsQuery.isPending}
          isError={eventsQuery.isError}
          empty={eventDays.length === 0}
          emptyLabel="No upcoming events."
        >
          <DayList
            days={eventDays}
            tomorrow={bounds.from}
            boardNameById={boardNameById}
            onToggleDone={(task) => toggleDone.mutate(task)}
          />
        </QueryState>
      </Panel>
    </Section>
  );
}

function NeedsOrganizingSection() {
  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: () => todexClient.boards.list(),
  });
  const boards = boardsQuery.data ?? [];
  const boardKey = boards.map((board) => board.id).join("\n");
  const tasksQuery = useQuery({
    queryKey: ["tasks", "root", boardKey],
    queryFn: () =>
      Promise.all(
        boards.map((board) => todexClient.tasks.list({ boardId: board.id })),
      ).then((lists) => lists.flat()),
    enabled: boardsQuery.isSuccess,
  });
  const toggleDone = useToggleTaskDone();
  const boardNameById = new Map(boards.map((board) => [board.id, board.name]));
  const organized = organizingTasks(tasksQuery.data ?? [], boardNameById);
  const waiting = boardsQuery.isPending || (boardsQuery.isSuccess && tasksQuery.isPending);
  const failed = boardsQuery.isError || tasksQuery.isError;

  return (
    <Section id={OVERVIEW_CHAPTERS[3].id} title="Needs Organizing">
      <Panel title="Inbox" href={tasksUrlHelper.routing.buildRootUrl()}>
        <QueryState
          isLoading={waiting}
          isError={failed}
          empty={organized.inbox.length === 0}
          emptyLabel="Inbox is clear."
        >
          <TaskRows
            tasks={organized.inbox.slice(0, ORGANIZING_PREVIEW_LIMIT)}
            hrefFor={(task) => taskHref(task, "later", boardNameById)}
            onToggleDone={(task) => toggleDone.mutate(task)}
          />
          <HiddenCount
            count={Math.max(0, organized.inbox.length - ORGANIZING_PREVIEW_LIMIT)}
          />
        </QueryState>
      </Panel>
      <Panel title="Unscheduled" href={tasksUrlHelper.routing.buildRootUrl()}>
        <QueryState
          isLoading={waiting}
          isError={failed}
          empty={organized.unscheduled.length === 0}
          emptyLabel="No unscheduled tasks."
        >
          <TaskRows
            tasks={organized.unscheduled.slice(0, ORGANIZING_PREVIEW_LIMIT)}
            hrefFor={(task) => taskHref(task, "later", boardNameById)}
            boardNameById={boardNameById}
            onToggleDone={(task) => toggleDone.mutate(task)}
          />
          <HiddenCount
            count={Math.max(
              0,
              organized.unscheduled.length - ORGANIZING_PREVIEW_LIMIT,
            )}
          />
        </QueryState>
      </Panel>
    </Section>
  );
}

function RecentDocsSection() {
  const docsQuery = useQuery({
    queryKey: ["docs"],
    queryFn: () => todexClient.docs.list(),
  });
  const docs = (docsQuery.data ?? []).slice(0, RECENT_DOCS_LIMIT);

  return (
    <Section id={OVERVIEW_CHAPTERS[4].id} title="Recent Docs">
      <div className="px-4 py-3">
        <div className="mb-2 flex items-center justify-end">
          <Link
            href="/docs"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Open
          </Link>
        </div>
        <QueryState
          isLoading={docsQuery.isPending}
          isError={docsQuery.isError}
          empty={docs.length === 0}
          emptyLabel="No docs yet."
        >
          <ul>
            {docs.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/docs/${doc.id}`}
                  className="flex items-center gap-3 py-1.5 text-sm hover:text-foreground"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {doc.docKey}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{doc.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {docTypeLabel(doc.type)}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatWhen(doc.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </QueryState>
      </div>
    </Section>
  );
}

function useToggleTaskDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (task: Task) =>
      todexClient.tasks.update(task.id, {
        status: statusAfterDoneToggle(task.status),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => toast.error("Could not update the task"),
  });
}

function Section({
  id,
  title,
  action,
  children,
}: {
  id: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="min-w-0 scroll-mt-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {action}
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        {children}
      </div>
    </section>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        <Link
          href={href}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Open
        </Link>
      </div>
      {children}
    </div>
  );
}

function QueryState({
  isLoading,
  isError,
  empty,
  emptyLabel,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  empty: boolean;
  emptyLabel: string;
  children: ReactNode;
}) {
  if (isLoading) return <Spinner className="py-2" />;
  if (isError) {
    return <p className="text-sm text-muted-foreground">Could not load.</p>;
  }
  if (empty) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return children;
}

function TaskRows({
  tasks,
  hrefFor,
  onToggleDone,
  boardNameById,
}: {
  tasks: Task[];
  hrefFor: (task: Task) => string;
  onToggleDone: (task: Task) => void;
  boardNameById?: Map<string, string>;
}) {
  if (tasks.length === 0) return null;
  return (
    <ul>
      {tasks.map((task) => {
        const time = isoToLocalTimeInput(task.scheduleDate);
        const done = task.status === TaskStatus.DONE;
        const boardName = boardNameById?.get(task.taskBoardId);
        return (
          <li key={task.id} className="flex items-center gap-2 py-1.5">
            <Checkbox
              checked={done}
              aria-label={
                done ? `Reopen ${task.summary}` : `Complete ${task.summary}`
              }
              onCheckedChange={() => onToggleDone(task)}
            />
            <Link
              href={hrefFor(task)}
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                done && "text-muted-foreground line-through",
              )}
            >
              <span className="mr-2 font-mono text-xs text-muted-foreground">
                {task.taskKey}
              </span>
              {task.summary}
            </Link>
            {boardName ? (
              <span className="shrink-0 text-xs text-muted-foreground">
                {boardName}
              </span>
            ) : null}
            {time ? (
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {time}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function EventRows({ events }: { events: CalendarBlock[] }) {
  if (events.length === 0) return null;
  return (
    <ul>
      {events.map((event) => (
        <li key={event.key} className="flex items-center gap-2 py-1.5">
          <Link
            href={eventHref(event)}
            className="min-w-0 flex-1 truncate text-sm"
          >
            {event.title}
          </Link>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatBlockWhen(event)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function HiddenCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return <p className="py-1 text-xs text-muted-foreground">{count} more</p>;
}

function DayList({
  days,
  tomorrow,
  boardNameById,
  onToggleDone,
}: {
  days: DayGroup[];
  tomorrow: Date;
  boardNameById: Map<string, string>;
  onToggleDone: (task: Task) => void;
}) {
  return (
    <div>
      {days.map((group, index) => (
        <div key={localDayKey(group.day)} className={cn(index > 0 && "mt-3")}>
          <h4 className="mb-1 text-xs text-muted-foreground">
            {formatDayLabel(group.day, tomorrow)}
          </h4>
          <TaskRows
            tasks={group.tasks.slice(0, UPCOMING_PREVIEW_LIMIT)}
            hrefFor={(task) =>
              taskHref(
                task,
                localDayKey(group.day) === localDayKey(tomorrow)
                  ? "tomorrow"
                  : "later",
                boardNameById,
              )
            }
            onToggleDone={onToggleDone}
          />
          <HiddenCount
            count={Math.max(0, group.tasks.length - UPCOMING_PREVIEW_LIMIT)}
          />
          <EventRows events={group.events.slice(0, UPCOMING_PREVIEW_LIMIT)} />
          <HiddenCount
            count={Math.max(0, group.events.length - UPCOMING_PREVIEW_LIMIT)}
          />
        </div>
      ))}
    </div>
  );
}

function dayGroups(
  from: Date,
  to: Date,
  tasks: Task[],
  events: CalendarBlock[],
): DayGroup[] {
  return localDays(from, to).flatMap((day) => {
    const dayTasks = tasksOnDay(tasks, day);
    const dayEvents = events.filter(
      (event) => localDayKey(event.start) === localDayKey(day),
    );
    if (dayTasks.length === 0 && dayEvents.length === 0) return [];
    return [{ day, tasks: dayTasks, events: dayEvents }];
  });
}

function taskHref(
  task: Task,
  when: "today" | "tomorrow" | "later",
  boardNameById: Map<string, string>,
): string {
  if (when === "today") {
    return tasksUrlHelper.routing.buildScheduleUrl("today", task.taskKey);
  }
  if (when === "tomorrow") {
    return tasksUrlHelper.routing.buildScheduleUrl("tomorrow", task.taskKey);
  }
  const boardName = boardNameById.get(task.taskBoardId);
  if (!boardName) return tasksUrlHelper.routing.buildRootUrl();
  return tasksUrlHelper.routing.buildBoardUrl(boardName, task.taskKey);
}

function sortEvents(events: CalendarBlock[]): CalendarBlock[] {
  return [...events].sort(
    (left, right) => left.start.getTime() - right.start.getTime(),
  );
}

function tasksOnDay(tasks: Task[], day: Date): Task[] {
  const key = localDayKey(day);
  return tasks.filter((task) => {
    if (!task.scheduleDate) return false;
    const scheduled = new Date(task.scheduleDate);
    return (
      !Number.isNaN(scheduled.getTime()) && localDayKey(scheduled) === key
    );
  });
}

function eventHref(event: CalendarBlock): string {
  if (!event.eventId) return "/calendar";
  if (!event.originalStart) return `/calendar/events/${event.eventId}`;
  return `/calendar/events/${event.eventId}?occurrence=${encodeURIComponent(event.originalStart)}`;
}

function formatBlockWhen(event: CalendarBlock): string {
  if (event.allDay) return "All day";
  return `${formatTime(event.start)}–${formatTime(event.end)}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDayLabel(day: Date, tomorrow: Date): string {
  if (localDayKey(day) === localDayKey(tomorrow)) return "Tomorrow";
  return day.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sessionSummary(tasks: Array<{ summary: string }>): string {
  if (tasks.length === 0) return "No task";
  return tasks.map((task) => task.summary).join(", ");
}

const EMPTY_BOARDS = new Map<string, string>();

interface DayGroup {
  day: Date;
  tasks: Task[];
  events: CalendarBlock[];
}
