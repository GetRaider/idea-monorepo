"use client";

import { createContext, use, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CalendarEvent,
  CalendarEventTemplate,
  ExecutionCalendar,
  ScheduleSlot,
  ScheduleSlotInput,
  Task,
  TaskCalendarPreview,
  Space,
} from "@repo/api/todex";

import type { CalendarMode, CalendarVisibility } from "./calendar-blocks";
import { deviceTimeZone } from "./calendar-datetime";
import { toast } from "sonner";

import { todexClient } from "@lib/todex-client";

const CalendarContext = createContext<CalendarContextValue | null>(null);
const CALENDAR_HOME = "/planning/calendar";

export function CalendarProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [range, setRange] = useState(initialRange);
  const [visibility, setVisibility] =
    useState<CalendarVisibility>(DEFAULT_VISIBILITY);
  const [mode, setModeState] = useState<CalendarMode>("planned");
  const [dayCount, setDayCountState] = useState(7);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [focusRequest, setFocusRequest] = useState<CalendarFocusRequest | null>(
    null,
  );
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [composer, setComposer] = useState<CalendarComposer | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const routeEventId = eventIdFromPath(pathname);
  const occurrence = searchParams.get("occurrence");
  const selectedTaskId = routeEventId ? null : searchParams.get("task");

  const eventsQuery = useQuery({
    queryKey: ["calendar-events", range.from, range.to],
    queryFn: () => todexClient.calendar.events.list(range),
  });
  const templatesQuery = useQuery({
    queryKey: ["calendar-templates"],
    queryFn: () => todexClient.calendar.templates.list(),
  });
  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: () => todexClient.spaces.list(),
  });
  const scheduleQuery = useQuery({
    queryKey: ["tasks", "schedule", range.from, range.to],
    queryFn: () =>
      todexClient.tasks.list({
        scheduleFrom: range.from,
        scheduleTo: range.to,
      }),
  });
  const tasksQuery = useQuery({
    queryKey: [
      "calendar-tasks",
      boardsQuery.data?.map((board) => board.id).join(","),
    ],
    enabled: Boolean(boardsQuery.data),
    queryFn: async () => {
      const boards = boardsQuery.data ?? [];
      const groups = await Promise.all(
        boards.map((board) => todexClient.tasks.list({ spaceId: board.id })),
      );
      return groups.flat();
    },
  });
  const timeZone = deviceTimeZone();
  const spaceColorKey = (boardsQuery.data ?? [])
    .map((board) => `${board.id}:${board.color}`)
    .join(",");
  const sessionsQuery = useQuery({
    queryKey: ["calendar-sessions", range.from, range.to, timeZone, spaceColorKey],
    enabled: mode === "actual" || mode === "both",
    queryFn: () =>
      todexClient.execution.calendar({
        from: range.from,
        to: range.to,
        timeZone,
      }),
    refetchInterval: (query) =>
      query.state.data?.sessions.some((session) =>
        session.slices.some((slice) => slice.endedAt == null),
      )
        ? 30_000
        : false,
  });

  useEffect(() => {
    const storedMode = readStorage(MODE_KEY);
    const storedCount = Number(readStorage(DAY_KEY));
    if (
      storedMode === "planned" ||
      storedMode === "actual" ||
      storedMode === "both"
    ) {
      setModeState(storedMode);
    }
    if (Number.isInteger(storedCount) && storedCount >= 1 && storedCount <= 7) {
      setDayCountState(storedCount);
    }
    setPreferencesReady(true);
  }, []);

  const selectedEvent =
    eventsQuery.data?.find((event) => event.id === routeEventId) ?? null;
  const selectedTask =
    tasksQuery.data?.find((task) => task.id === selectedTaskId) ?? null;

  const invalidateEvents = () =>
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] });

  const createEvent = useMutation({
    mutationFn: todexClient.calendar.events.create,
    onSuccess: invalidateEvents,
    onError: () => toast.error("Could not create the event"),
  });
  const updateEvent = useMutation({
    mutationFn: (input: { eventId: string; body: unknown }) =>
      todexClient.calendar.events.update(input.eventId, input.body),
    onSuccess: invalidateEvents,
    onError: () => toast.error("Could not update the event"),
  });
  const removeEvent = useMutation({
    mutationFn: (input: {
      eventId: string;
      scope?: "instance" | "series";
      originalStart?: string;
    }) => todexClient.calendar.events.remove(input.eventId, input),
    onSuccess: async () => {
      await invalidateEvents();
      router.push(CALENDAR_HOME);
    },
    onError: () => toast.error("Could not delete the event"),
  });
  const createTemplate = useMutation({
    mutationFn: todexClient.calendar.templates.create,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["calendar-templates"] }),
    onError: () => toast.error("Could not save the template"),
  });
  const updateTemplate = useMutation({
    mutationFn: (input: { templateId: string; body: unknown }) =>
      todexClient.calendar.templates.update(input.templateId, input.body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["calendar-templates"] }),
    onError: () => toast.error("Could not update the template"),
  });
  const removeTemplate = useMutation({
    mutationFn: todexClient.calendar.templates.remove,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["calendar-templates"] }),
    onError: () => toast.error("Could not delete the template"),
  });
  const updateTask = useMutation({
    mutationFn: (input: {
      taskId: string;
      slotId?: string | null;
      startAt?: string;
      endAt?: string;
      estimation?: number;
    }) => {
      const task = (tasksQuery.data ?? []).find(
        (item) => item.id === input.taskId,
      );
      if (!task) throw new Error("Task version is missing");
      return todexClient.tasks.update(input.taskId, {
        version: task.version,
        ...(input.startAt && input.endAt
          ? {
              scheduleSlots: nextScheduleSlots(
                task.scheduleSlots,
                input.slotId ?? null,
                input.startAt,
                input.endAt,
              ),
            }
          : {}),
        ...(input.estimation !== undefined
          ? { estimation: input.estimation }
          : {}),
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["calendar-tasks"] }),
    onError: () => toast.error("Could not update the task"),
  });

  const value = useMemo<CalendarContextValue>(
    () => ({
      state: {
        range,
        events: eventsQuery.data ?? [],
        templates: templatesQuery.data ?? [],
        tasks: tasksQuery.data ?? [],
        sessions: sessionsQuery.data?.sessions ?? [],
        previews: scheduleQuery.data?.previews ?? [],
        boards: boardsQuery.data ?? [],
        visibility,
        mode,
        dayCount: mode === "both" ? Math.min(dayCount, 2) : dayCount,
        preferencesReady,
        focusRequest,
        scheduleOpen,
        composer,
        selectedSessionId,
        selectedEvent,
        selectedTaskId,
        selectedTask,
        occurrence,
        isLoading: eventsQuery.isLoading,
      },
      actions: {
        setRange: (next) => {
          setRange((current) =>
            current.from === next.from && current.to === next.to
              ? current
              : next,
          );
        },
        setVisibility: (patch) => {
          setVisibility((current) => ({ ...current, ...patch }));
        },
        setMode: (next) => {
          setModeState((current) => {
            if (next === "both" && current !== "both" && dayCount > 2) {
              writeStorage(BEFORE_KEY, String(dayCount));
            }
            if (current === "both" && next !== "both") {
              removeStorage(BEFORE_KEY);
            }
            writeStorage(MODE_KEY, next);
            return next;
          });
        },
        setDayCount: (count) => {
          if (mode === "both" && count > 2) return;
          if (mode === "both") removeStorage(BEFORE_KEY);
          writeStorage(DAY_KEY, String(count));
          setDayCountState(count);
        },
        focusDay: (day) => {
          setFocusRequest({ date: day.toISOString(), id: Date.now() });
        },
        setScheduleOpen,
        openComposer: (next) => {
          setComposer(next);
          if (routeEventId || searchParams.get("task")) router.push(CALENDAR_HOME);
        },
        closeComposer: () => setComposer(null),
        openSession: (sessionId) => {
          setComposer(null);
          setSelectedSessionId(sessionId);
          if (routeEventId || searchParams.get("task")) router.push(CALENDAR_HOME);
        },
        closeSession: () => setSelectedSessionId(null),
        openEvent: (eventId, originalStart) => {
          setComposer(null);
          const search = originalStart
            ? `?occurrence=${encodeURIComponent(originalStart)}`
            : "";
          router.push(`${CALENDAR_HOME}/events/${eventId}${search}`);
        },
        closeEvent: () => router.push(CALENDAR_HOME),
        openTask: (taskId) => {
          setComposer(null);
          router.push(`${CALENDAR_HOME}?task=${encodeURIComponent(taskId)}`);
        },
        closeTask: () => router.push(CALENDAR_HOME),
        createEvent: (body) => createEvent.mutateAsync(body),
        updateEvent: (eventId, body) =>
          updateEvent.mutateAsync({ eventId, body }),
        removeEvent: (eventId, scope, originalStart) =>
          removeEvent.mutateAsync({ eventId, scope, originalStart }),
        createTemplate: (body) => createTemplate.mutateAsync(body),
        updateTemplate: (templateId, body) =>
          updateTemplate.mutateAsync({ templateId, body }),
        removeTemplate: (templateId) => removeTemplate.mutateAsync(templateId),
        updateTask: (taskId, patch) =>
          updateTask.mutateAsync({ taskId, ...patch }),
        updateSessionTitle: (sessionId, title) =>
          todexClient.execution.updateSession(sessionId, { title }).then(async (sessions) => {
            await queryClient.invalidateQueries({ queryKey: ["calendar-sessions"] });
            return sessions;
          }),
      },
    }),
    [
      range,
      eventsQuery.data,
      eventsQuery.isLoading,
      templatesQuery.data,
      tasksQuery.data,
      sessionsQuery.data,
      scheduleQuery.data,
      boardsQuery.data,
      visibility,
      mode,
      dayCount,
      preferencesReady,
      focusRequest,
      scheduleOpen,
      composer,
      selectedSessionId,
      selectedEvent,
      selectedTaskId,
      selectedTask,
      occurrence,
      routeEventId,
      searchParams,
      router,
      createEvent,
      updateEvent,
      removeEvent,
      createTemplate,
      updateTemplate,
      removeTemplate,
      updateTask,
      queryClient,
    ],
  );

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const value = use(CalendarContext);
  if (!value)
    throw new Error("useCalendar must be used within CalendarProvider");
  return value;
}

function eventIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/planning\/calendar\/events\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

const DEFAULT_VISIBILITY: CalendarVisibility = {
  events: true,
  tasks: true,
};

const MODE_KEY = "todex.calendar.mode";
const DAY_KEY = "todex.calendar.dayCount";
const BEFORE_KEY = "todex.calendar.dayCountBeforeBoth";

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function removeStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    return;
  }
}

function initialRange(): { from: string; to: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 8);
  return { from: start.toISOString(), to: end.toISOString() };
}

function nextScheduleSlots(
  slots: ScheduleSlot[],
  slotId: string | null,
  startAt: string,
  endAt: string,
): ScheduleSlotInput[] {
  const kept = slots.map((slot) => ({
    id: slot.id,
    startAt: slot.startAt,
    endAt: slot.endAt,
    retiredAt: slot.retiredAt,
  }));
  if (!slotId) return [...kept, { startAt, endAt }];
  return kept.map((slot) =>
    slot.id === slotId ? { ...slot, startAt, endAt } : slot,
  );
}

interface CalendarContextValue {
  state: {
    range: { from: string; to: string };
    events: CalendarEvent[];
    templates: CalendarEventTemplate[];
    tasks: Task[];
    sessions: ExecutionCalendar["sessions"];
    previews: TaskCalendarPreview[];
    boards: Space[];
    visibility: CalendarVisibility;
    mode: CalendarMode;
    dayCount: number;
    preferencesReady: boolean;
    focusRequest: CalendarFocusRequest | null;
    scheduleOpen: boolean;
    composer: CalendarComposer | null;
    selectedSessionId: string | null;
    selectedEvent: CalendarEvent | null;
    selectedTaskId: string | null;
    selectedTask: Task | null;
    occurrence: string | null;
    isLoading: boolean;
  };
  actions: {
    setRange: (range: { from: string; to: string }) => void;
    setVisibility: (patch: Partial<CalendarVisibility>) => void;
    setMode: (mode: CalendarMode) => void;
    setDayCount: (count: number) => void;
    focusDay: (day: Date) => void;
    setScheduleOpen: (open: boolean) => void;
    openComposer: (draft: CalendarComposer) => void;
    closeComposer: () => void;
    openSession: (sessionId: string) => void;
    closeSession: () => void;
    openEvent: (eventId: string, originalStart?: string | null) => void;
    closeEvent: () => void;
    openTask: (taskId: string) => void;
    closeTask: () => void;
    createEvent: (body: unknown) => Promise<CalendarEvent>;
    updateEvent: (eventId: string, body: unknown) => Promise<CalendarEvent>;
    removeEvent: (
      eventId: string,
      scope?: "instance" | "series",
      originalStart?: string,
    ) => Promise<{ ok: boolean }>;
    createTemplate: (body: unknown) => Promise<CalendarEventTemplate>;
    updateTemplate: (
      templateId: string,
      body: unknown,
    ) => Promise<CalendarEventTemplate>;
    removeTemplate: (templateId: string) => Promise<{ ok: boolean }>;
    updateTask: (
      taskId: string,
      patch: {
        slotId?: string | null;
        startAt?: string;
        endAt?: string;
        estimation?: number;
      },
    ) => Promise<Task>;
    updateSessionTitle: (sessionId: string, title: string) => Promise<unknown>;
  };
}

interface CalendarFocusRequest {
  date: string;
  id: number;
}

export interface CalendarComposer {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  kind: "event" | "task";
  taskId: string;
}
