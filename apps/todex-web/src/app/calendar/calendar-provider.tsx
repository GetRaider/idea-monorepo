"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CalendarEvent,
  CalendarEventTemplate,
  Task,
  TaskBoard,
} from "@repo/api/todex";

import type { CalendarVisibility } from "./calendar-blocks";
import { toast } from "sonner";

import { todexClient } from "@lib/todex-client";

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [range, setRange] = useState(initialRange);
  const [visibility, setVisibility] = useState<CalendarVisibility>(DEFAULT_VISIBILITY);
  const [focusRequest, setFocusRequest] = useState<CalendarFocusRequest | null>(
    null,
  );
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
    queryFn: () => todexClient.boards.list(),
  });
  const tasksQuery = useQuery({
    queryKey: ["calendar-tasks", boardsQuery.data?.map((board) => board.id).join(",")],
    enabled: Boolean(boardsQuery.data),
    queryFn: async () => {
      const boards = boardsQuery.data ?? [];
      const groups = await Promise.all(
        boards.map((board) => todexClient.tasks.list({ boardId: board.id })),
      );
      return groups.flat();
    },
  });

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
      router.push("/calendar");
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
      scheduleDate?: string | null;
      estimation?: number | null;
      color?: string | null;
    }) =>
      todexClient.tasks.update(input.taskId, {
        ...(input.scheduleDate !== undefined
          ? { scheduleDate: input.scheduleDate }
          : {}),
        ...(input.estimation !== undefined
          ? { estimation: input.estimation }
          : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      }),
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
        boards: boardsQuery.data ?? [],
        visibility,
        focusRequest,
        selectedEvent,
        selectedTaskId,
        selectedTask,
        occurrence,
        isLoading: eventsQuery.isLoading,
      },
      actions: {
        setRange: (next) => {
          setRange((current) =>
            current.from === next.from && current.to === next.to ? current : next,
          );
        },
        setVisibility: (patch) => {
          setVisibility((current) => ({ ...current, ...patch }));
        },
        focusDay: (day) => {
          setFocusRequest({ date: day.toISOString(), id: Date.now() });
        },
        openEvent: (eventId, originalStart) => {
          const search = originalStart
            ? `?occurrence=${encodeURIComponent(originalStart)}`
            : "";
          router.push(`/calendar/events/${eventId}${search}`);
        },
        closeEvent: () => router.push("/calendar"),
        openTask: (taskId) => router.push(`/calendar?task=${encodeURIComponent(taskId)}`),
        closeTask: () => router.push("/calendar"),
        createEvent: (body) => createEvent.mutateAsync(body),
        updateEvent: (eventId, body) =>
          updateEvent.mutateAsync({ eventId, body }),
        removeEvent: (eventId, scope, originalStart) =>
          removeEvent.mutateAsync({ eventId, scope, originalStart }),
        createTemplate: (body) => createTemplate.mutateAsync(body),
        updateTemplate: (templateId, body) =>
          updateTemplate.mutateAsync({ templateId, body }),
        removeTemplate: (templateId) => removeTemplate.mutateAsync(templateId),
        updateTask: (taskId, patch) => updateTask.mutateAsync({ taskId, ...patch }),
      },
    }),
    [
      range,
      eventsQuery.data,
      eventsQuery.isLoading,
      templatesQuery.data,
      tasksQuery.data,
      boardsQuery.data,
      visibility,
      focusRequest,
      selectedEvent,
      selectedTaskId,
      selectedTask,
      occurrence,
      router,
      createEvent,
      updateEvent,
      removeEvent,
      createTemplate,
      updateTemplate,
      removeTemplate,
      updateTask,
    ],
  );

  return (
    <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
  );
}

export function useCalendar() {
  const value = use(CalendarContext);
  if (!value) throw new Error("useCalendar must be used within CalendarProvider");
  return value;
}

function eventIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/calendar\/events\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

const DEFAULT_VISIBILITY: CalendarVisibility = {
  events: true,
  tasks: true,
};

function initialRange(): { from: string; to: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 8);
  return { from: start.toISOString(), to: end.toISOString() };
}

interface CalendarContextValue {
  state: {
    range: { from: string; to: string };
    events: CalendarEvent[];
    templates: CalendarEventTemplate[];
    tasks: Task[];
    boards: TaskBoard[];
    visibility: CalendarVisibility;
    focusRequest: CalendarFocusRequest | null;
    selectedEvent: CalendarEvent | null;
    selectedTaskId: string | null;
    selectedTask: Task | null;
    occurrence: string | null;
    isLoading: boolean;
  };
  actions: {
    setRange: (range: { from: string; to: string }) => void;
    setVisibility: (patch: Partial<CalendarVisibility>) => void;
    focusDay: (day: Date) => void;
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
        scheduleDate?: string | null;
        estimation?: number | null;
        color?: string | null;
      },
    ) => Promise<Task>;
  };
}

interface CalendarFocusRequest {
  date: string;
  id: number;
}
