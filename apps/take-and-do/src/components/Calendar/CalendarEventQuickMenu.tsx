"use client";

import { useSession } from "@/auth/client";
import type { RefObject } from "react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, MoreVertical, X } from "lucide-react";

import { ConfirmDialog } from "@/components/Dialogs";
import { Dropdown } from "@/components/Dropdown";
import { FullScreenIcon } from "@/components/Icons/FullScreenIcon";
import { Input } from "@/components/Input";
import { useIsAnonymous } from "@/hooks/auth/use-is-anonymous";
import { useTasks } from "@/hooks/tasks/useTasks";
import { cn } from "@/lib/styles/utils";
import type {
  CalendarEventType,
  CalendarEvent,
  CalendarRepeatValue,
  CalendarTimeZone,
  CalendarRsvpStatus,
} from "@/types/calendar.types";

import { CalendarColorPickerPopover } from "./CalendarColorPickerPopover";
import {
  effectiveKindColor,
  eventFillHex,
  normalizeHexColor,
} from "./calendar-colors";
import type { CalendarEventColorTheme } from "./calendar-event-mapper";
import {
  kindLabel,
  calendarCommonEventUsesGoogleCalendar,
} from "./calendar-event-mapper";
import { CalendarEventTaskSection } from "./CalendarEventTaskSection";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  toLocalDateInputValue,
} from "./datetime-local";
import { timeZoneOptions } from "./timezones";

export type CalendarQuickMenuPayload =
  | {
      mode: "existing";
      event: CalendarEvent;
      anchor: { clientX: number; clientY: number };
      anchorRect?: DOMRect;
    }
  | {
      mode: "draft";
      start: Date;
      /** Inclusive end for form display / editing. */
      end: Date;
      /** FullCalendar selection end (exclusive), for re-applying the grid highlight. */
      fcSelectionEnd: Date;
      allDay: boolean;
      anchor: { clientX: number; clientY: number };
      anchorRect?: DOMRect;
    };

export type CalendarOpenFullEditorContext = {
  mode: "existing" | "draft";
  event?: CalendarEvent;
  range?: { start: Date; end: Date; allDay: boolean };
  quickFields: {
    title: string;
    type: CalendarEventType;
    description: string;
    color?: string;
    saveToGoogle?: boolean;
  };
};

interface CalendarEventQuickMenuProps {
  payload: CalendarQuickMenuPayload;
  /** DOM node that bounds the popup (calendar surface). */
  scopeRef: RefObject<HTMLElement | null>;
  googleCalendarConnected?: boolean;
  onCreateDraft?: (
    event: CalendarEvent,
    opts?: { saveToGoogle?: boolean },
  ) => void;
  onClose: () => void;
  /** Opens the full Create / Edit event dialog. */
  onOpenFullEditor: (context: CalendarOpenFullEditorContext) => void;
  onPersistExisting?: (
    id: string,
    patch: Partial<
      Omit<
        CalendarEvent,
        "id" | "type" | "taskBoardId" | "taskId" | "taskScope" | "color"
      >
    > & { color?: string | null },
  ) => void;
  onDuplicate?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  onRsvpChange?: (
    id: string,
    rsvp: CalendarRsvpStatus,
    declineReason?: string,
  ) => void;
  /** Re-run FullCalendar draft highlight (e.g. after type dropdown interaction). */
  onDraftSelectionBump?: () => void;
  /** Keeps the grid selection tint in sync while choosing a draft event type. */
  onDraftKindChange?: (kind: CalendarEventType) => void;
  /** Matches planning calendar slot labels and quick-menu summaries. */
  displayTimes24h?: boolean;
  onDisplayTimes24hChange?: (next: boolean) => void;
  calendarColorTheme?: CalendarEventColorTheme;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function splitDatetimeLocalParts(value: string): {
  date: string;
  time: string;
} {
  const date = value.length >= 10 ? value.slice(0, 10) : "";
  const time = value.length >= 16 ? value.slice(11, 16) : "00:00";
  return { date, time };
}

function joinDatetimeLocalParts(date: string, time: string) {
  const raw = time && time.length >= 4 ? time.slice(0, 5) : "00:00";
  const [h, m] = raw.split(":");
  const hh = pad2(Number.parseInt(h || "0", 10) || 0);
  const mm = pad2(Number.parseInt(m || "0", 10) || 0);
  return `${date}T${hh}:${mm}`;
}

function formatTimeDisplay(d: Date, use24h: boolean) {
  if (use24h) return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatWeekdayMonthDay(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function durationLabelMs(ms: number) {
  const m = Math.max(1, Math.round(ms / 60000));
  return `${m}min`;
}

type CommonCreateDestination = "internal" | "google";

export function CalendarEventQuickMenu({
  payload,
  scopeRef,
  googleCalendarConnected,
  onCreateDraft,
  onClose,
  onOpenFullEditor,
  onPersistExisting,
  onDuplicate,
  onDeleteEvent,
  onRsvpChange,
  onDraftSelectionBump,
  onDraftKindChange,
  displayTimes24h,
  onDisplayTimes24hChange,
  calendarColorTheme,
}: CalendarEventQuickMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const kindSelectId = useId();
  const { data: session } = useSession();
  const isGuest = useIsAnonymous();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const allDay =
    payload.mode === "existing" ? payload.event.allDay : payload.allDay;

  const [title, setTitle] = useState(() =>
    payload.mode === "existing" ? payload.event.title : "",
  );
  const [kind, setKind] = useState<CalendarEventType>(() =>
    payload.mode === "existing" ? payload.event.type : "timeBlock",
  );
  const [commonCreateDestination, setCommonCreateDestination] =
    useState<CommonCreateDestination>("internal");
  const [description, setDescription] = useState(() =>
    payload.mode === "existing" ? (payload.event.description ?? "") : "",
  );
  const [notes, setNotes] = useState(() => {
    if (payload.mode !== "existing") return "";
    return payload.event.type !== "task" ? (payload.event.notes ?? "") : "";
  });
  const [meetingUrl, setMeetingUrl] = useState(() => {
    if (payload.mode !== "existing") return "";
    return payload.event.type !== "task"
      ? (payload.event.meetingUrl ?? "")
      : "";
  });
  const [participantsText, setParticipantsText] = useState(() => {
    if (payload.mode !== "existing") return "";
    return payload.event.type !== "task"
      ? (payload.event.participants ?? []).join(", ")
      : "";
  });
  const [participantsFocused, setParticipantsFocused] = useState(false);
  const [taskBoardId, setTaskBoardId] = useState(() =>
    payload.mode === "existing" && payload.event.type === "task"
      ? payload.event.taskBoardId
      : "",
  );
  const [taskId, setTaskId] = useState(() =>
    payload.mode === "existing" && payload.event.type === "task"
      ? payload.event.taskId
      : "",
  );
  const [taskSummarySnapshot, setTaskSummarySnapshot] = useState(() =>
    payload.mode === "existing" && payload.event.type === "task"
      ? (payload.event.taskSummarySnapshot ?? "")
      : "",
  );
  const [timeZone, setTimeZone] = useState<CalendarTimeZone>(() =>
    payload.mode === "existing" ? (payload.event.timeZone ?? "") : "",
  );
  const [repeat, setRepeat] = useState<CalendarRepeatValue>(() =>
    payload.mode === "existing" ? (payload.event.repeat ?? "") : "",
  );
  const [reminderMinutes, setReminderMinutes] = useState(() =>
    payload.mode === "existing" &&
    typeof payload.event.reminderMinutes === "number"
      ? String(payload.event.reminderMinutes)
      : "",
  );
  const [eventColorHex, setEventColorHex] = useState(() =>
    payload.mode === "existing"
      ? (normalizeHexColor(payload.event.color) ?? "")
      : "",
  );
  const [startValue, setStartValue] = useState(() =>
    payload.mode === "existing"
      ? payload.event.allDay
        ? `${toLocalDateInputValue(new Date(payload.event.start))}T00:00`
        : toDatetimeLocalValue(new Date(payload.event.start))
      : "",
  );
  const [endValue, setEndValue] = useState(() =>
    payload.mode === "existing"
      ? payload.event.allDay
        ? `${toLocalDateInputValue(new Date(payload.event.end))}T00:00`
        : toDatetimeLocalValue(new Date(payload.event.end))
      : "",
  );
  const [declineReason, setDeclineReason] = useState(() => {
    if (payload.mode !== "existing") return "";
    return payload.event.type === "common"
      ? (payload.event.rsvpDeclineReason ?? "")
      : "";
  });
  const [showDeclineField, setShowDeclineField] = useState(() => {
    if (payload.mode !== "existing") return false;
    return payload.event.type === "common" && payload.event.rsvpStatus === "no";
  });

  const isTask = kind === "task";

  const { tasks: boardTasks } = useTasks({
    taskBoardId: isTask ? taskBoardId || undefined : undefined,
  });

  const linkedTask = useMemo(
    () => (taskId ? boardTasks.find((t) => t.id === taskId) : undefined),
    [boardTasks, taskId],
  );

  useEffect(() => {
    if (payload.mode === "existing") {
      const e = payload.event;
      setTitle(e.title);
      setKind(e.type);
      setDescription(e.description ?? "");
      setNotes(e.type !== "task" ? (e.notes ?? "") : "");
      setMeetingUrl(e.type !== "task" ? (e.meetingUrl ?? "") : "");
      setParticipantsText(
        e.type !== "task" ? (e.participants ?? []).join(", ") : "",
      );
      setTimeZone(e.timeZone ?? "");
      setRepeat(e.repeat ?? "");
      setReminderMinutes(
        typeof e.reminderMinutes === "number" ? String(e.reminderMinutes) : "",
      );
      const start = new Date(e.start);
      const end = new Date(e.end);
      setStartValue(
        e.allDay
          ? `${toLocalDateInputValue(start)}T00:00`
          : toDatetimeLocalValue(start),
      );
      setEndValue(
        e.allDay
          ? `${toLocalDateInputValue(end)}T00:00`
          : toDatetimeLocalValue(end),
      );
      setDeclineReason(e.type === "common" ? (e.rsvpDeclineReason ?? "") : "");
      setShowDeclineField(e.type === "common" && e.rsvpStatus === "no");
      if (e.type === "task") {
        setTaskBoardId(e.taskBoardId);
        setTaskId(e.taskId);
        setTaskSummarySnapshot(e.taskSummarySnapshot ?? "");
      } else {
        setTaskBoardId("");
        setTaskId("");
        setTaskSummarySnapshot("");
      }
      setEventColorHex(normalizeHexColor(e.color) ?? "");
      setCommonCreateDestination("internal");
    } else {
      setTitle("");
      setKind("timeBlock");
      setDescription("");
      setNotes("");
      setMeetingUrl("");
      setParticipantsText("");
      setTimeZone("");
      setRepeat("");
      setReminderMinutes("");
      setStartValue(
        payload.allDay
          ? `${toLocalDateInputValue(payload.start)}T00:00`
          : toDatetimeLocalValue(payload.start),
      );
      setEndValue(
        payload.allDay
          ? `${toLocalDateInputValue(payload.end)}T00:00`
          : toDatetimeLocalValue(payload.end),
      );
      setDeclineReason("");
      setShowDeclineField(false);
      setTaskBoardId("");
      setTaskId("");
      setTaskSummarySnapshot("");
      setEventColorHex("");
      setCommonCreateDestination("internal");
    }
  }, [payload]);

  useEffect(() => {
    if (payload.mode !== "draft") return;
    onDraftKindChange?.(kind);
    onDraftSelectionBump?.();
  }, [kind, payload.mode, onDraftKindChange, onDraftSelectionBump]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // Dropdown menus are portaled to body; treat them as "inside" the quick menu.
      if (target?.closest?.("[data-dropdown-portal]")) return;
      if (target?.closest?.("[data-calendar-color-menu]")) return;
      const el = panelRef.current;
      if (!el || el.contains(e.target as Node)) return;
      onClose();
    };
    const t = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointer);
    }, 200);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [onClose]);

  const anchor = payload.anchor;
  const anchorRect = payload.anchorRect;
  const pad = 12;

  const desiredWidth = useMemo(() => {
    if (typeof window === "undefined") return 380;
    const scopeWidth = scopeRef.current?.getBoundingClientRect().width;
    const max = 360;
    const min = 300;
    const base =
      typeof scopeWidth === "number" ? scopeWidth : window.innerWidth;
    return Math.min(max, Math.max(min, base - pad * 2));
  }, [scopeRef]);

  const [pos, setPos] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el || typeof window === "undefined") return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const scopeRect =
        scopeRef.current?.getBoundingClientRect() ??
        ({
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
          right: window.innerWidth,
          bottom: window.innerHeight,
        } as DOMRect);

      const w = Math.min(desiredWidth, scopeRect.width - pad * 2);
      const h = rect.height || 520;

      const anchorX =
        (anchorRect
          ? (anchorRect.left + anchorRect.right) / 2
          : anchor.clientX) - scopeRect.left;
      const anchorY =
        (anchorRect
          ? (anchorRect.top + anchorRect.bottom) / 2
          : anchor.clientY) - scopeRect.top;

      const rightEdge = anchorRect
        ? anchorRect.right - scopeRect.left
        : anchorX;
      const leftEdge = anchorRect ? anchorRect.left - scopeRect.left : anchorX;
      const spaceRight = scopeRect.width - rightEdge;
      const spaceLeft = leftEdge;
      const wantsRight = spaceRight >= w + pad * 2 || spaceRight >= spaceLeft;
      const left = wantsRight
        ? Math.max(pad, Math.min(rightEdge + pad, scopeRect.width - w - pad))
        : Math.max(
            pad,
            Math.min(leftEdge - w - pad, scopeRect.width - w - pad),
          );

      const below =
        (anchorRect ? anchorRect.bottom - scopeRect.top : anchorY) + pad;
      const above =
        (anchorRect ? anchorRect.top - scopeRect.top : anchorY) - h - pad;
      const canFitBelow = below + h + pad <= scopeRect.height;
      const canFitAbove = above >= pad;

      const top = (() => {
        if (scopeRect.height < 480 || scopeRect.width < 380) return pad;
        if (canFitBelow) return below;
        if (canFitAbove) return above;
        return Math.max(pad, Math.min(below, scopeRect.height - h - pad));
      })();

      setPos({ left, top, width: w });
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [anchor.clientX, anchor.clientY, anchorRect, desiredWidth, scopeRef]);

  const slotPreview24h = displayTimes24h ?? false;

  const previewBounds = useMemo(() => {
    const fallbackStart =
      payload.mode === "existing"
        ? new Date(payload.event.start)
        : payload.start;
    const fallbackEnd =
      payload.mode === "existing" ? new Date(payload.event.end) : payload.end;
    if (allDay) {
      const ds = startValue.slice(0, 10);
      const de = endValue.slice(0, 10);
      const s = new Date(`${ds}T12:00:00`);
      const e = new Date(`${de}T12:00:00`);
      if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
        return { start: s, end: e };
      }
    } else {
      const s = fromDatetimeLocalValue(startValue);
      const e = fromDatetimeLocalValue(endValue);
      if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
        return { start: s, end: e };
      }
    }
    return { start: fallbackStart, end: fallbackEnd };
  }, [allDay, startValue, endValue, payload]);

  const timeRow = allDay
    ? "All day"
    : `${formatTimeDisplay(previewBounds.start, slotPreview24h)} → ${formatTimeDisplay(previewBounds.end, slotPreview24h)}`;
  const duration = allDay
    ? ""
    : durationLabelMs(
        previewBounds.end.getTime() - previewBounds.start.getTime(),
      );
  const dateLine = formatWeekdayMonthDay(previewBounds.start);

  const email =
    session?.user?.email ??
    (session?.user?.name ? String(session.user.name) : null);

  const colorFillPreview = useMemo(() => {
    const custom = normalizeHexColor(eventColorHex);
    if (custom) return custom;
    if (payload.mode === "existing") {
      return eventFillHex(payload.event, calendarColorTheme ?? {});
    }
    return effectiveKindColor(kind, calendarColorTheme?.kindColors);
  }, [eventColorHex, payload, kind, calendarColorTheme]);

  const quickFields = useMemo(() => {
    const colorField = normalizeHexColor(eventColorHex);
    const colorOpt = colorField ? { color: colorField } : {};
    const saveToGoogleOpt =
      kind === "common" &&
      googleCalendarConnected &&
      commonCreateDestination === "google"
        ? { saveToGoogle: true as const }
        : {};
    if (kind === "task") {
      const summary = linkedTask?.summary?.trim() ?? taskSummarySnapshot.trim();
      const desc = linkedTask?.description?.trim() ?? "";
      return { title: summary, type: kind, description: desc, ...colorOpt };
    }
    return { title, type: kind, description, ...colorOpt, ...saveToGoogleOpt };
  }, [
    kind,
    linkedTask,
    taskSummarySnapshot,
    title,
    description,
    eventColorHex,
    googleCalendarConnected,
    commonCreateDestination,
  ]);

  const parseParticipants = (raw: string) =>
    raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

  const participantSuggest = useMemo(() => {
    if (isTask) return { token: "", list: [] as string[] };
    const raw = participantsText;
    const lastComma = raw.lastIndexOf(",");
    const token = (lastComma >= 0 ? raw.slice(lastComma + 1) : raw).trim();
    const q = token.toLowerCase();
    const base = (() => {
      if (typeof window === "undefined") return [] as string[];
      try {
        const raw = window.localStorage.getItem("take-and-do:calendar:v1");
        if (!raw) return [] as string[];
        const parsed = JSON.parse(raw) as { events?: unknown[] } | null;
        if (!parsed || !Array.isArray(parsed.events)) return [] as string[];
        const out: string[] = [];
        for (const ev of parsed.events) {
          if (
            ev &&
            typeof ev === "object" &&
            (ev as { type?: unknown }).type !== "task"
          ) {
            const parts = (ev as { participants?: unknown }).participants;
            if (Array.isArray(parts)) {
              for (const p of parts) {
                if (typeof p === "string" && p.trim()) out.push(p.trim());
              }
            }
          }
        }
        return Array.from(new Set(out)).sort();
      } catch {
        return [] as string[];
      }
    })();
    const list = q
      ? base.filter((p) => p.toLowerCase().includes(q)).slice(0, 8)
      : base.slice(0, 8);
    return { token, list };
  }, [isTask, participantsText]);

  const handleOpenFull = () => {
    if (payload.mode === "existing") {
      const participants = parseParticipants(participantsText);
      const merged: CalendarEvent =
        kind === "task"
          ? {
              ...payload.event,
              type: "task",
              title: (
                linkedTask?.summary?.trim() ||
                taskSummarySnapshot.trim() ||
                payload.event.title
              ).slice(0, 200),
              ...(linkedTask?.description?.trim()
                ? { description: linkedTask.description.trim() }
                : { description: undefined }),
              taskBoardId,
              taskId,
              ...(linkedTask?.summary?.trim() || taskSummarySnapshot.trim()
                ? {
                    taskSummarySnapshot: (linkedTask?.summary?.trim() ||
                      taskSummarySnapshot.trim()) as string,
                  }
                : {}),
            }
          : kind === "timeBlock"
            ? {
                ...payload.event,
                type: "timeBlock",
                title: (title.trim() || payload.event.title).slice(0, 200),
                ...(description.trim()
                  ? { description: description.trim() }
                  : { description: undefined }),
                notes: notes.trim() || undefined,
                meetingUrl: meetingUrl.trim() || undefined,
                participants: participants.length ? participants : undefined,
                timeZone: timeZone.trim() || undefined,
                repeat: repeat || undefined,
              }
            : {
                ...payload.event,
                type: "common",
                title: (title.trim() || payload.event.title).slice(0, 200),
                ...(description.trim()
                  ? { description: description.trim() }
                  : { description: undefined }),
                notes: notes.trim() || undefined,
                meetingUrl: meetingUrl.trim() || undefined,
                participants: participants.length ? participants : undefined,
                timeZone: timeZone.trim() || undefined,
                repeat: repeat || undefined,
              };
      let mergedWithColor: CalendarEvent = merged;
      const picked = normalizeHexColor(eventColorHex);
      if (picked) mergedWithColor = { ...merged, color: picked };
      else {
        mergedWithColor = { ...merged };
        delete (mergedWithColor as { color?: string }).color;
      }
      onOpenFullEditor({
        mode: "existing",
        event: mergedWithColor,
        quickFields,
      });
    } else {
      const start = payload.allDay
        ? new Date(`${startValue.slice(0, 10)}T00:00`)
        : fromDatetimeLocalValue(startValue);
      const end = payload.allDay
        ? new Date(`${endValue.slice(0, 10)}T23:59`)
        : fromDatetimeLocalValue(endValue);
      onOpenFullEditor({
        mode: "draft",
        range: {
          start: Number.isNaN(start.getTime()) ? payload.start : start,
          end: Number.isNaN(end.getTime()) ? payload.end : end,
          allDay: payload.allDay,
        },
        quickFields,
      });
    }
    onClose();
  };

  const isGoogleImported =
    payload.mode === "existing" && payload.event.id.startsWith("gcal:");

  const lockImportedCommonKind =
    isGoogleImported &&
    payload.mode === "existing" &&
    payload.event.type === "common";

  const initialSnapshot = useMemo(() => {
    if (payload.mode !== "existing") return null;
    const e = payload.event;
    return {
      title: e.title ?? "",
      kind: e.type,
      description: e.description ?? "",
      notes: e.type !== "task" ? (e.notes ?? "") : "",
      meetingUrl: e.type !== "task" ? (e.meetingUrl ?? "") : "",
      participantsText:
        e.type !== "task" ? (e.participants ?? []).join(", ") : "",
      timeZone: e.timeZone ?? "",
      repeat: e.repeat ?? "",
      reminderMinutes:
        typeof e.reminderMinutes === "number" ? String(e.reminderMinutes) : "",
      startValue: e.allDay
        ? `${toLocalDateInputValue(new Date(e.start))}T00:00`
        : toDatetimeLocalValue(new Date(e.start)),
      endValue: e.allDay
        ? `${toLocalDateInputValue(new Date(e.end))}T00:00`
        : toDatetimeLocalValue(new Date(e.end)),
      allDay: e.allDay,
      color: normalizeHexColor(e.color) ?? "",
      ...(e.type === "task"
        ? {
            taskBoardId: e.taskBoardId,
            taskId: e.taskId,
            taskSummarySnapshot: e.taskSummarySnapshot ?? "",
          }
        : {}),
    };
  }, [payload]);

  const isDirty =
    payload.mode === "existing" &&
    !!initialSnapshot &&
    (kind !== initialSnapshot.kind ||
      startValue !== initialSnapshot.startValue ||
      endValue !== initialSnapshot.endValue ||
      (isTask && "taskBoardId" in initialSnapshot
        ? taskBoardId !== initialSnapshot.taskBoardId ||
          taskId !== initialSnapshot.taskId
        : !isTask &&
          (title !== initialSnapshot.title ||
            description !== initialSnapshot.description ||
            notes !== initialSnapshot.notes ||
            meetingUrl !== initialSnapshot.meetingUrl ||
            participantsText !== initialSnapshot.participantsText ||
            timeZone !== initialSnapshot.timeZone ||
            repeat !== initialSnapshot.repeat ||
            reminderMinutes !== initialSnapshot.reminderMinutes)) ||
      (normalizeHexColor(eventColorHex) ?? "") !==
        (initialSnapshot.color ?? ""));

  const handleSave = () => {
    if (payload.mode !== "existing" || !onPersistExisting) return;
    if (kind === "task") {
      if (!taskBoardId.trim() || !taskId.trim()) return;
      const summary =
        linkedTask?.summary?.trim() ||
        taskSummarySnapshot.trim() ||
        payload.event.title.trim();
      if (!summary) return;
    } else {
      if (!title.trim()) return;
    }

    const participants = parseParticipants(participantsText);
    const reminder =
      reminderMinutes.trim() && !Number.isNaN(Number(reminderMinutes))
        ? Number(reminderMinutes)
        : undefined;

    const start = payload.event.allDay
      ? new Date(`${startValue.slice(0, 10)}T00:00`)
      : fromDatetimeLocalValue(startValue);
    const end = payload.event.allDay
      ? new Date(`${endValue.slice(0, 10)}T23:59`)
      : fromDatetimeLocalValue(endValue);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    if (end.getTime() <= start.getTime() && !payload.event.allDay) return;

    const t = title.trim();

    const nextColor = normalizeHexColor(eventColorHex);
    const prevColor = normalizeHexColor(
      initialSnapshot?.color ? initialSnapshot.color : undefined,
    );
    const colorPayload =
      (nextColor ?? "") === (prevColor ?? "")
        ? {}
        : { color: nextColor ?? null };

    onPersistExisting(payload.event.id, {
      ...(kind === "task"
        ? {
            title: (
              linkedTask?.summary?.trim() ||
              taskSummarySnapshot.trim() ||
              payload.event.title
            ).slice(0, 200),
            description: linkedTask?.description?.trim() || undefined,
            taskSummarySnapshot:
              (linkedTask?.summary ?? taskSummarySnapshot).trim() || undefined,
          }
        : {
            title: t.slice(0, 200),
            description: description.trim() || undefined,
            notes: notes.trim() || undefined,
            meetingUrl: meetingUrl.trim() || undefined,
            participants: participants.length ? participants : undefined,
            timeZone: timeZone.trim() || undefined,
            repeat: repeat || undefined,
            reminderMinutes: reminder,
          }),
      start: start.toISOString(),
      end: end.toISOString(),
      ...colorPayload,
    });

    onClose();
  };

  const handleCreateInstant = () => {
    if (payload.mode !== "draft" || !onCreateDraft) return;
    if (kind === "task" && (!taskBoardId.trim() || !taskId.trim())) return;
    const taskSummaryForCreate =
      kind === "task"
        ? linkedTask?.summary?.trim() || taskSummarySnapshot.trim()
        : "";
    if (kind === "task" && !taskSummaryForCreate) return;

    const start = payload.allDay
      ? new Date(`${startValue.slice(0, 10)}T00:00`)
      : fromDatetimeLocalValue(startValue);
    const end = payload.allDay
      ? new Date(`${endValue.slice(0, 10)}T23:59`)
      : fromDatetimeLocalValue(endValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    if (!payload.allDay && end.getTime() <= start.getTime()) return;

    const participants = parseParticipants(participantsText);
    const reminder =
      reminderMinutes.trim() && !Number.isNaN(Number(reminderMinutes))
        ? Number(reminderMinutes)
        : undefined;

    const fillPick = normalizeHexColor(eventColorHex);
    const base = {
      id: crypto.randomUUID(),
      title: (kind === "task"
        ? taskSummaryForCreate
        : title.trim() || "Untitled"
      ).slice(0, 200),
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: payload.allDay,
      ...(fillPick ? { color: fillPick } : {}),
    } as const;

    const event: CalendarEvent =
      kind === "task"
        ? {
            ...base,
            type: "task",
            taskBoardId: taskBoardId.trim(),
            taskId: taskId.trim(),
            ...(linkedTask?.description?.trim()
              ? { description: linkedTask.description.trim() }
              : {}),
            ...(taskSummaryForCreate
              ? { taskSummarySnapshot: taskSummaryForCreate }
              : {}),
          }
        : kind === "timeBlock"
          ? {
              ...base,
              type: "timeBlock",
              ...(description.trim()
                ? { description: description.trim() }
                : {}),
              ...(notes.trim() ? { notes: notes.trim() } : {}),
              ...(meetingUrl.trim() ? { meetingUrl: meetingUrl.trim() } : {}),
              ...(participants.length ? { participants } : {}),
              ...(timeZone.trim() ? { timeZone: timeZone.trim() } : {}),
              ...(repeat ? { repeat } : {}),
              ...(typeof reminder === "number"
                ? { reminderMinutes: reminder }
                : {}),
            }
          : {
              ...base,
              type: "common",
              ...(description.trim()
                ? { description: description.trim() }
                : {}),
              ...(notes.trim() ? { notes: notes.trim() } : {}),
              ...(meetingUrl.trim() ? { meetingUrl: meetingUrl.trim() } : {}),
              ...(participants.length ? { participants } : {}),
              ...(timeZone.trim() ? { timeZone: timeZone.trim() } : {}),
              ...(repeat ? { repeat } : {}),
              ...(typeof reminder === "number"
                ? { reminderMinutes: reminder }
                : {}),
            };

    onCreateDraft(event, {
      saveToGoogle:
        kind === "common" &&
        !!googleCalendarConnected &&
        commonCreateDestination === "google",
    });
    onClose();
  };

  const applyRsvp = (rsvp: CalendarRsvpStatus) => {
    if (payload.mode !== "existing" || !onRsvpChange) return;
    const baseEvent = payload.event;
    if (rsvp === "no") {
      onRsvpChange(baseEvent.id, "no", declineReason.trim() || undefined);
    } else {
      onRsvpChange(baseEvent.id, rsvp, undefined);
    }
    if (rsvp !== "no") onClose();
  };

  const section = "px-4 py-4";
  const sectionTitleClass = "m-0 mb-2 text-sm font-medium text-zinc-200";

  const handleConfirmDelete = () => {
    if (payload.mode !== "existing" || !onDeleteEvent) return;
    onDeleteEvent(payload.event);
    onClose();
  };

  return (
    <>
      {createPortal(
        <div
          className="calendar-quick-menu pointer-events-none absolute inset-0 z-[4500]"
          role="presentation"
          aria-hidden
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-labelledby={kindSelectId}
            className={cn(
              "pointer-events-auto absolute flex max-h-[min(560px,calc(100%-24px))] flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[rgba(44,40,58,0.94)] via-[rgba(26,24,36,0.97)] to-[rgba(18,16,26,0.98)] shadow-[0_28px_90px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl",
            )}
            style={{
              left: pos?.left ?? pad,
              top: pos?.top ?? pad,
              width: pos?.width ?? desiredWidth,
            }}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3.5 py-3",
              )}
            >
              <div className="min-w-0 flex-1">
                <Dropdown<CalendarEventType>
                  id={kindSelectId}
                  options={[
                    { value: "timeBlock", label: kindLabel("timeBlock") },
                    { value: "common", label: kindLabel("common") },
                    { value: "task", label: kindLabel("task") },
                  ]}
                  value={kind}
                  onChange={(next) => {
                    if (next !== "common")
                      setCommonCreateDestination("internal");
                    setKind(next);
                  }}
                  fullWidth={false}
                  disabled={lockImportedCommonKind}
                />
              </div>
              <div className="relative flex items-center gap-1">
                {payload.mode === "existing" &&
                (onDuplicate || onDeleteEvent) ? (
                  <div className="relative">
                    <button
                      type="button"
                      title="More"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border-0 bg-transparent text-zinc-500 transition-colors hover:bg-white/[0.07] hover:text-white"
                      onClick={() => setMenuOpen((v) => !v)}
                    >
                      <MoreVertical size={18} strokeWidth={1.75} aria-hidden />
                    </button>
                    {menuOpen ? (
                      <div className="absolute right-0 top-10 z-[1] min-w-[140px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#1e1e26] shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
                        {onDuplicate ? (
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-xs font-medium text-zinc-200 hover:bg-white/[0.06]"
                            onClick={() => {
                              onDuplicate(payload.event);
                              setMenuOpen(false);
                              onClose();
                            }}
                          >
                            Duplicate
                          </button>
                        ) : null}
                        {onDeleteEvent ? (
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-xs font-medium text-red-300 hover:bg-red-500/10"
                            onClick={() => {
                              setShowDeleteConfirm(true);
                              setMenuOpen(false);
                            }}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {onDisplayTimes24hChange ? (
                  <div
                    className="mr-0.5 flex shrink-0 items-center rounded-lg border border-white/[0.08] bg-black/25 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    role="group"
                    aria-label="Time display format"
                  >
                    <button
                      type="button"
                      className={cn(
                        "rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors",
                        !slotPreview24h
                          ? "bg-white/[0.1] text-white"
                          : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200",
                      )}
                      onClick={() => onDisplayTimes24hChange(false)}
                    >
                      12h
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors",
                        slotPreview24h
                          ? "bg-white/[0.1] text-white"
                          : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200",
                      )}
                      onClick={() => onDisplayTimes24hChange(true)}
                    >
                      24h
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  title="Open full editor"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border-0 bg-transparent text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white"
                  onClick={handleOpenFull}
                >
                  <FullScreenIcon
                    size={18}
                    className="text-current"
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  title="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border-0 bg-transparent text-zinc-500 transition-colors hover:bg-white/[0.07] hover:text-white"
                  onClick={onClose}
                >
                  <X size={20} strokeWidth={1.75} aria-hidden />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch]">
              {!isTask ? (
                <div className={cn(section, "border-b border-white/[0.05]")}>
                  <p className={sectionTitleClass}>Title</p>
                  <div className="flex min-w-0 items-center gap-2">
                    <Input
                      className="min-w-0 flex-1 rounded-xl border-white/[0.08] bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] placeholder:text-zinc-600"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title"
                      aria-label="Title"
                      maxLength={200}
                    />
                    <CalendarColorPickerPopover
                      selectedHex={colorFillPreview}
                      onSelect={(hex) => setEventColorHex(hex)}
                      onResetToDefault={() => setEventColorHex("")}
                      trigger={
                        <span
                          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/[0.18] shadow-inner"
                          style={{ backgroundColor: colorFillPreview }}
                          aria-label="Event color"
                        />
                      }
                    />
                  </div>
                </div>
              ) : null}

              {isTask ? (
                <div className={cn(section, "border-b border-white/[0.05]")}>
                  <p className={sectionTitleClass}>Task</p>
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="shrink-0 pt-0.5">
                      <CalendarColorPickerPopover
                        selectedHex={colorFillPreview}
                        onSelect={(hex) => setEventColorHex(hex)}
                        onResetToDefault={() => setEventColorHex("")}
                        trigger={
                          <span
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/[0.18] shadow-inner"
                            style={{ backgroundColor: colorFillPreview }}
                            aria-label="Event color"
                          />
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CalendarEventTaskSection
                        taskBoardId={taskBoardId}
                        taskId={taskId}
                        isGuest={isGuest}
                        inputClass=""
                        onBoardChange={(boardId) => {
                          setTaskBoardId(boardId);
                          setTaskId("");
                          setTaskSummarySnapshot("");
                        }}
                        onTaskChange={(tid, snap) => {
                          setTaskId(tid);
                          setTaskSummarySnapshot(snap);
                        }}
                        onTitleSync={(summary) =>
                          setTitle((t) => (!t.trim() ? summary : t))
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {kind === "common" ? (
                <div className={cn(section, "border-b border-white/[0.05]")}>
                  <p className={sectionTitleClass}>Destination</p>
                  <Dropdown<CommonCreateDestination>
                    options={[
                      {
                        value: "internal",
                        label: "Internal (this calendar)",
                      },
                      { value: "google", label: "Google Calendar" },
                    ]}
                    value={
                      payload.mode === "existing"
                        ? calendarCommonEventUsesGoogleCalendar(payload.event)
                          ? "google"
                          : "internal"
                        : commonCreateDestination
                    }
                    onChange={setCommonCreateDestination}
                    disabled={
                      payload.mode === "existing" ||
                      (payload.mode === "draft" && !googleCalendarConnected)
                    }
                    fullWidth
                  />
                </div>
              ) : null}

              <div
                className={cn(
                  section,
                  "border-b border-white/[0.05] space-y-2",
                )}
              >
                <div className="min-w-0">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className={sectionTitleClass}>Start</p>
                      {allDay ? (
                        <input
                          type="date"
                          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                          value={startValue.slice(0, 10)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setStartValue(`${v}T00:00`);
                          }}
                        />
                      ) : (
                        <>
                          <input
                            type="date"
                            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                            value={splitDatetimeLocalParts(startValue).date}
                            onChange={(e) => {
                              const v = e.target.value;
                              setStartValue((prev) =>
                                joinDatetimeLocalParts(
                                  v,
                                  splitDatetimeLocalParts(prev).time,
                                ),
                              );
                            }}
                          />
                          <input
                            type="time"
                            step={900}
                            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                            value={splitDatetimeLocalParts(startValue).time}
                            onChange={(e) => {
                              const v = e.target.value;
                              setStartValue((prev) =>
                                joinDatetimeLocalParts(
                                  splitDatetimeLocalParts(prev).date,
                                  v,
                                ),
                              );
                            }}
                          />
                        </>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className={sectionTitleClass}>End</p>
                      {allDay ? (
                        <input
                          type="date"
                          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                          value={endValue.slice(0, 10)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEndValue(`${v}T00:00`);
                          }}
                        />
                      ) : (
                        <>
                          <input
                            type="date"
                            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                            value={splitDatetimeLocalParts(endValue).date}
                            onChange={(e) => {
                              const v = e.target.value;
                              setEndValue((prev) =>
                                joinDatetimeLocalParts(
                                  v,
                                  splitDatetimeLocalParts(prev).time,
                                ),
                              );
                            }}
                          />
                          <input
                            type="time"
                            step={900}
                            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                            value={splitDatetimeLocalParts(endValue).time}
                            onChange={(e) => {
                              const v = e.target.value;
                              setEndValue((prev) =>
                                joinDatetimeLocalParts(
                                  splitDatetimeLocalParts(prev).date,
                                  v,
                                ),
                              );
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <p className="m-0 mt-3 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-white/[0.04] px-3 py-2 text-xs leading-snug text-zinc-400 ring-1 ring-white/[0.06]">
                    <span className="font-medium text-zinc-200">{timeRow}</span>
                    {duration ? (
                      <>
                        <span className="text-zinc-600" aria-hidden>
                          ·
                        </span>
                        <span>{duration}</span>
                      </>
                    ) : null}
                    <span className="text-zinc-600" aria-hidden>
                      ·
                    </span>
                    <span>{dateLine}</span>
                  </p>
                </div>
              </div>

              {!isTask ? (
                <div className={cn(section, "border-b border-white/[0.05]")}>
                  <p className={sectionTitleClass}>Description</p>
                  <textarea
                    className="min-h-[88px] w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm leading-relaxed text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Feel free to mention task or docs by @"
                  />
                </div>
              ) : null}

              {!isTask ? (
                <div className={cn(section, "space-y-3 pb-5")}>
                  <details className="group overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.04]">
                      <span>Details</span>
                      <ChevronDown
                        size={18}
                        className="shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <div className="space-y-3 border-t border-white/[0.05] px-3.5 pb-3.5 pt-3">
                      <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <p className="m-0 mb-1.5 text-xs font-medium text-zinc-500">
                              Time zone
                            </p>
                            <Dropdown<string>
                              options={timeZoneOptions()}
                              value={timeZone}
                              onChange={setTimeZone}
                              fullWidth
                            />
                          </div>
                          <div>
                            <p className="m-0 mb-1.5 text-xs font-medium text-zinc-500">
                              Repeat
                            </p>
                            <Dropdown<CalendarRepeatValue>
                              options={[
                                { value: "", label: "Does not repeat" },
                                { value: "daily", label: "Daily" },
                                { value: "weekly", label: "Weekly" },
                                { value: "monthly", label: "Monthly" },
                              ]}
                              value={repeat}
                              onChange={setRepeat}
                              fullWidth
                            />
                          </div>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <p className="m-0 text-xs font-medium text-zinc-500">
                            Participants
                          </p>
                          <Input
                            value={participantsText}
                            onChange={(e) =>
                              setParticipantsText(e.target.value)
                            }
                            onFocus={() => setParticipantsFocused(true)}
                            onBlur={() => {
                              window.setTimeout(
                                () => setParticipantsFocused(false),
                                120,
                              );
                            }}
                            placeholder="Add participants (comma-separated)"
                            className="rounded-xl border-white/[0.08] bg-white/[0.04] text-sm text-zinc-200 placeholder:text-zinc-600"
                            maxLength={128}
                          />
                          {participantsFocused &&
                          participantSuggest.list.length ? (
                            <div className="mt-1 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]">
                              {participantSuggest.list.map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  className="block w-full truncate px-3 py-2 text-left text-xs text-zinc-200 hover:bg-white/[0.06]"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    const existing =
                                      parseParticipants(participantsText);
                                    if (existing.includes(p)) return;
                                    const next = existing.length
                                      ? `${existing.join(", ")}, ${p}`
                                      : p;
                                    setParticipantsText(next);
                                  }}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <p className="m-0 text-xs font-medium text-zinc-500">
                            Meeting URL
                          </p>
                          <Input
                            value={meetingUrl}
                            onChange={(e) => setMeetingUrl(e.target.value)}
                            placeholder="Paste a link"
                            className="rounded-xl border-white/[0.08] bg-white/[0.04] text-sm text-zinc-200 placeholder:text-zinc-600"
                            maxLength={256}
                          />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <p className="m-0 text-xs font-medium text-zinc-500">
                            Notes
                          </p>
                          <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes"
                            className="rounded-xl border-white/[0.08] bg-white/[0.04] text-sm text-zinc-200 placeholder:text-zinc-600"
                            maxLength={256}
                          />
                        </div>

                        {isGoogleImported ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-white" />
                              <span className="truncate text-sm text-zinc-200">
                                {email ?? "Not signed in"}
                              </span>
                            </div>
                            <p className="m-0 text-xs text-zinc-500">
                              <span className="text-zinc-400">Busy</span>
                              {" · "}
                              <span>Default visibility</span>
                            </p>
                          </div>
                        ) : null}

                        {payload.mode === "existing" ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div>
                                <p className="m-0 mb-1.5 text-xs font-medium text-zinc-500">
                                  Reminders
                                </p>
                                <Dropdown<string>
                                  options={[
                                    { value: "", label: "None" },
                                    { value: "5", label: "5 min before" },
                                    { value: "10", label: "10 min before" },
                                    { value: "30", label: "30 min before" },
                                    { value: "60", label: "1 hour before" },
                                  ]}
                                  value={reminderMinutes}
                                  onChange={setReminderMinutes}
                                  fullWidth
                                />
                              </div>

                              {onRsvpChange ? (
                                <div>
                                  <p className="m-0 mb-1.5 text-xs font-medium text-zinc-500">
                                    Your RSVP
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {(
                                      [
                                        { v: "yes" as const, label: "Yes" },
                                        { v: "maybe" as const, label: "Maybe" },
                                        { v: "no" as const, label: "No" },
                                      ] as const
                                    ).map(({ v, label }) => (
                                      <button
                                        key={v}
                                        type="button"
                                        className={cn(
                                          "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                                          payload.event.type === "common" &&
                                            payload.event.rsvpStatus === v
                                            ? "border-[#7255c1] bg-[#7255c1]/30 text-white"
                                            : "border-white/15 bg-transparent text-zinc-300 hover:border-white/25",
                                        )}
                                        onClick={() => {
                                          if (v === "no") {
                                            setShowDeclineField(true);
                                            return;
                                          }
                                          applyRsvp(v);
                                        }}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>

                            {onRsvpChange && showDeclineField ? (
                              <div className="space-y-2">
                                <textarea
                                  className="w-full resize-none rounded-lg border border-white/12 bg-input-bg px-2 py-2 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                                  rows={2}
                                  value={declineReason}
                                  onChange={(e) =>
                                    setDeclineReason(e.target.value)
                                  }
                                  placeholder="Optional reason if you can’t attend"
                                />
                                <button
                                  type="button"
                                  className="w-full rounded-lg border-0 bg-[#7255c1] py-2 text-xs font-medium text-white hover:bg-[#6346b0]"
                                  onClick={() => applyRsvp("no")}
                                >
                                  Save &quot;No&quot;
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    </div>
                  </details>
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-white/[0.06] bg-black/25 px-4 py-3.5 backdrop-blur-sm">
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  className="rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:bg-white/[0.08]"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    payload.mode === "existing"
                      ? !isDirty
                      : isTask &&
                        (!taskBoardId.trim() ||
                          !taskId.trim() ||
                          !(
                            linkedTask?.summary?.trim() ||
                            taskSummarySnapshot.trim()
                          ))
                  }
                  className={cn(
                    "rounded-xl border-0 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_28px_rgba(114,85,193,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] transition-[filter,opacity]",
                    payload.mode === "existing"
                      ? isDirty
                        ? "bg-gradient-to-b from-[#8f73e8] to-[#6346c4] hover:brightness-105"
                        : "cursor-not-allowed bg-gradient-to-b from-[#6b5a9e]/55 to-[#4f4278]/55 opacity-65 shadow-none"
                      : "bg-gradient-to-b from-[#8f73e8] to-[#6346c4] hover:brightness-105",
                  )}
                  onClick={
                    payload.mode === "existing"
                      ? handleSave
                      : handleCreateInstant
                  }
                >
                  {payload.mode === "existing" ? "Save" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        scopeRef.current ?? document.body,
      )}
      {showDeleteConfirm && payload.mode === "existing" && onDeleteEvent ? (
        <ConfirmDialog
          title="Delete event?"
          description="This will permanently delete this event. This action cannot be undone."
          confirmLabel="Delete"
          overlayClassName="z-[4600]"
          onConfirm={handleConfirmDelete}
          onClose={() => setShowDeleteConfirm(false)}
          maxWidth={520}
        />
      ) : null}
    </>
  );
}
