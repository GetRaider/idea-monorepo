"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DocType, TaskPriority, TaskStatus, parseEstimation } from "@repo/api/todex";
import type { Task } from "@repo/api/todex";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@repo/ui";
import { toast } from "sonner";

import { tasksUrlHelper } from "@/helpers/tasks-url.helper";
import { todexClient } from "@lib/todex-client";

import {
  deviceTimeZone,
  fromInputValue,
  toInputValue,
} from "../app/calendar/calendar-datetime";
import { PriorityGlyph, StatusGlyph } from "../app/tasks/task-board.ui";
import { DatePicker, EstimatePicker } from "../app/tasks/task-pickers";
import {
  INBOX_BOARD_NAME,
  STATUS_LABEL,
  STATUS_ORDER,
  dateInputToScheduleIso,
} from "../app/tasks/task-helpers";

import { ChevronIcon, PlusIcon } from "./icons";

export function CreateMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !event.metaKey) return;
      if (event.shiftKey || event.altKey || event.repeat) return;
      event.preventDefault();
      setOpen((current) => !current);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Tooltip open={open ? false : undefined}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Create"
            onClick={() => setOpen(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 transition-colors hover:bg-white"
          >
            <PlusIcon size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex items-center gap-1.5">
          Create
          <kbd className="rounded border border-white/20 px-1 font-sans text-[10px] leading-none">
            ⌘K
          </kbd>
        </TooltipContent>
      </Tooltip>
      {open ? <CreatePalette onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function CreatePalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const nameRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<CreateKind>("task");
  const [name, setName] = useState("");
  const [estimationText, setEstimationText] = useState("");
  const [estimationError, setEstimationError] = useState<string | null>(null);
  const [status, setStatus] = useState<Task["status"]>(TaskStatus.TODO);
  const [priority, setPriority] = useState<Task["priority"]>(TaskPriority.MEDIUM);
  const [scheduleDate, setScheduleDate] = useState("");
  const [boardId, setBoardId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [eventStart, setEventStart] = useState(defaultEventRange().start);
  const [eventEnd, setEventEnd] = useState(defaultEventRange().end);
  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: () => todexClient.boards.list(),
    enabled: kind === "task",
  });
  const boards = boardsQuery.data ?? [];
  const inboxBoard = boards.find((board) => board.name === INBOX_BOARD_NAME);
  const resolvedBoardId = boardId || inboxBoard?.id || "";
  const boardQuery = useQuery({
    queryKey: ["board", resolvedBoardId],
    queryFn: () => todexClient.boards.get(resolvedBoardId),
    enabled: kind === "task" && Boolean(resolvedBoardId),
  });
  const areas = boardQuery.data?.areas ?? [];
  const selectedArea = areas.find((area) => area.id === areaId) ?? null;
  const kindLabel = KINDS.find((option) => option.id === kind)?.label ?? "Task";
  const boardLabel =
    boards.find((board) => board.id === resolvedBoardId)?.name ?? INBOX_BOARD_NAME;

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    setAreaId("");
  }, [resolvedBoardId]);

  const createTask = useMutation({
    mutationFn: (estimation: number) =>
      todexClient.tasks.create({
        taskBoardId: resolvedBoardId,
        summary: name.trim(),
        estimation,
        status,
        priority,
        scheduleDate: dateInputToScheduleIso(scheduleDate),
        ...(selectedArea ? { areaId: selectedArea.id } : {}),
      }),
    onSuccess: async (task) => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      const board = boards.find((item) => item.id === resolvedBoardId);
      router.push(
        board
          ? tasksUrlHelper.routing.buildBoardUrl(board.name, task.taskKey)
          : "/tasks",
      );
      onClose();
    },
    onError: () => toast.error("Could not create the task"),
  });
  const createDoc = useMutation({
    mutationFn: () =>
      todexClient.docs.create({
        type: DocType.COMMON,
        title: name.trim(),
        folderId: null,
      }),
    onSuccess: async (doc) => {
      await queryClient.invalidateQueries({ queryKey: ["docs"] });
      router.push(`/docs/${doc.id}`);
      onClose();
    },
    onError: () => toast.error("Could not create the doc"),
  });
  const createEvent = useMutation({
    mutationFn: () => {
      const start = fromInputValue(eventStart, false);
      const end = fromInputValue(eventEnd, false);
      if (!start || !end) throw new Error("Invalid time");
      return todexClient.calendar.events.create({
        title: name.trim(),
        start,
        end,
        allDay: false,
        timeZone: deviceTimeZone(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      router.push("/calendar");
      onClose();
    },
    onError: () => toast.error("Could not create the event"),
  });
  const pending = createTask.isPending || createDoc.isPending || createEvent.isPending;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (kind === "task") {
      const estimation = parseEstimation(estimationText);
      if (estimationText.trim() && estimation === null) {
        setEstimationError("Use 1h, 30m, or 2d");
        return;
      }
      if (estimation == null || estimation <= 0) {
        setEstimationError("Estimate is required");
        return;
      }
      setEstimationError(null);
      if (!name.trim() || !resolvedBoardId) return;
      createTask.mutate(estimation);
      return;
    }
    if (kind === "doc") {
      if (!name.trim()) return;
      createDoc.mutate();
      return;
    }
    const start = fromInputValue(eventStart, false);
    const end = fromInputValue(eventEnd, false);
    if (!name.trim() || !start || !end || Date.parse(start) >= Date.parse(end)) return;
    createEvent.mutate();
  }

  const eventRangeInvalid = (() => {
    const start = fromInputValue(eventStart, false);
    const end = fromInputValue(eventEnd, false);
    if (!start || !end) return true;
    return Date.parse(start) >= Date.parse(end);
  })();
  const canSubmit = createReady(kind, {
    name,
    resolvedBoardId,
    boardsLoading: boardsQuery.isLoading,
    eventRangeInvalid,
  });

  return (
    <div
      className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onClose}
    >
      <form
        role="dialog"
        aria-label="Create"
        className="w-full max-w-xl rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        onSubmit={submit}
      >
        <div className="relative flex items-center gap-2 px-4 pb-3 pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-sm text-muted-foreground outline-none hover:bg-white/5 hover:text-foreground">
              {kindLabel}
              <ChevronIcon size={12} className="rotate-90" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-[6000]">
              {KINDS.map((option) => (
                <DropdownMenuItem key={option.id} onSelect={() => setKind(option.id)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={nameRef}
            value={name}
            placeholder={PLACEHOLDERS[kind]}
            className="min-w-0 flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground"
            onChange={(event) => setName(event.target.value)}
          />
          <div className="pointer-events-none absolute bottom-3 right-3 top-4 flex items-center bg-popover pl-1">
            <div className="pointer-events-none absolute inset-y-0 right-full w-8 bg-gradient-to-r from-transparent to-popover" />
            <Button
              type="submit"
              size="sm"
              className="pointer-events-auto h-7 px-3 text-xs"
              disabled={pending || !canSubmit}
            >
              Create
            </Button>
          </div>
        </div>
        {kind === "doc" ? null : (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border px-4 py-3">
          {kind === "task" ? (
            <>
              <PropertyMenu label={STATUS_LABEL[status]} menuLabel="Status">
                {STATUS_ORDER.map((option) => (
                  <DropdownMenuItem key={option} onSelect={() => setStatus(option)}>
                    <StatusGlyph status={option} />
                    {STATUS_LABEL[option]}
                  </DropdownMenuItem>
                ))}
              </PropertyMenu>
              <PropertyMenu
                menuLabel="Priority"
                label={
                  <span className="inline-flex items-center gap-1">
                    <PriorityGlyph priority={priority} />
                    {PRIORITY_LABEL[priority]}
                  </span>
                }
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <DropdownMenuItem key={option} onSelect={() => setPriority(option)}>
                    <PriorityGlyph priority={option} />
                    {PRIORITY_LABEL[option]}
                  </DropdownMenuItem>
                ))}
              </PropertyMenu>
              <EstimatePicker
                value={estimationText}
                onChange={(next) => {
                  setEstimationText(next);
                  setEstimationError(null);
                }}
              />
              <DatePicker
                emptyLabel="Schedule"
                value={scheduleDate}
                onChange={setScheduleDate}
              />
              <PropertyMenu label={boardLabel} menuLabel="Board">
                {boards.map((board) => (
                  <DropdownMenuItem key={board.id} onSelect={() => setBoardId(board.id)}>
                    {board.name}
                  </DropdownMenuItem>
                ))}
              </PropertyMenu>
              {areas.length > 0 ? (
                <PropertyMenu label={selectedArea?.name ?? "Area"} menuLabel="Area">
                  <DropdownMenuItem onSelect={() => setAreaId("")}>None</DropdownMenuItem>
                  {areas.map((area) => (
                    <DropdownMenuItem key={area.id} onSelect={() => setAreaId(area.id)}>
                      {area.name}
                    </DropdownMenuItem>
                  ))}
                </PropertyMenu>
              ) : null}
            </>
          ) : null}
          {kind === "event" ? (
            <>
              <Input
                type="datetime-local"
                aria-label="Starts"
                value={eventStart}
                className="h-7 w-auto rounded-full px-2.5 text-xs"
                onChange={(event) => setEventStart(event.target.value)}
              />
              <Input
                type="datetime-local"
                aria-label="Ends"
                value={eventEnd}
                className="h-7 w-auto rounded-full px-2.5 text-xs"
                onChange={(event) => setEventEnd(event.target.value)}
              />
            </>
          ) : null}
        </div>
        )}
        {estimationError ? (
          <p className="px-4 pb-3 text-xs text-destructive">{estimationError}</p>
        ) : null}
        {kind === "task" && boardsQuery.isError && boards.length === 0 ? (
          <p className="px-4 pb-3 text-xs text-destructive">Could not load boards.</p>
        ) : null}
        {kind === "event" && eventRangeInvalid ? (
          <p className="px-4 pb-3 text-xs text-destructive">End must be after start.</p>
        ) : null}
      </form>
    </div>
  );
}

function PropertyMenu({
  label,
  menuLabel,
  children,
}: {
  label: ReactNode;
  menuLabel: string;
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={menuLabel}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-[6000]">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function createReady(
  kind: CreateKind,
  input: {
    name: string;
    resolvedBoardId: string;
    boardsLoading: boolean;
    eventRangeInvalid: boolean;
  },
) {
  if (kind === "task") {
    return Boolean(input.name.trim() && input.resolvedBoardId && !input.boardsLoading);
  }
  if (kind === "doc") return Boolean(input.name.trim());
  return Boolean(input.name.trim()) && !input.eventRangeInvalid;
}

function defaultEventRange() {
  const start = nextHalfHour(new Date());
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    start: toInputValue(start.toISOString(), false),
    end: toInputValue(end.toISOString(), false),
  };
}

function nextHalfHour(now: Date) {
  const start = new Date(now);
  start.setSeconds(0, 0);
  const minutes = start.getMinutes();
  const remainder = minutes % 30;
  if (remainder !== 0) start.setMinutes(minutes + (30 - remainder));
  return start;
}

const KINDS = [
  { id: "task", label: "Task" },
  { id: "doc", label: "Doc" },
  { id: "event", label: "Event" },
] as const;

const PLACEHOLDERS: Record<CreateKind, string> = {
  task: "Task name",
  doc: "Doc title",
  event: "Event name",
};

const PRIORITY_OPTIONS = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.CRITICAL,
] as const;

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High",
  [TaskPriority.CRITICAL]: "Critical",
};

type CreateKind = (typeof KINDS)[number]["id"];
