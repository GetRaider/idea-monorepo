"use client";

import { useSession } from "@/auth/client";
import { useEffect, useId, useMemo, useState, type LegacyRef } from "react";
import { createPortal } from "react-dom";

import { ConfirmDialog } from "@/components/Dialogs";
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

import { GOOGLE_CALENDAR_EVENT_ID_PREFIX } from "@/constants/calendar.constants";

import {
  effectiveKindColor,
  eventFillHex,
  normalizeHexColor,
} from "@/helpers/calendar/calendar-colors";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  toLocalDateInputValue,
} from "@/helpers/calendar/datetime-local";
import {
  durationLabelMs,
  formatTimeDisplay,
  formatWeekdayMonthDay,
} from "@/helpers/calendar/calendar-event-quick-menu-format";
import type {
  QuickMenuProps,
  CommonCreateDestination,
} from "./quickMenu.types";
export type {
  CalendarOpenFullEditorContext,
  CalendarQuickMenuPayload,
} from "./quickMenu.types";

import { QuickMenuFooter } from "./QuickMenuFooter";
import { QuickMenuHeader } from "./QuickMenuHeader";
import { QuickMenuBody } from "./QuickMenuBody";
import {
  getCalendarParticipantSuggest,
  parseParticipantCsv,
} from "./quickMenuParticipants";
import { useQuickMenuPosition } from "./useQuickMenuPosition";

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
}: QuickMenuProps) {
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
  const [taskScope, setTaskScope] = useState<string[]>(() =>
    payload.mode === "existing" && payload.event.type === "timeBlock"
      ? [...(payload.event.taskScope ?? [])]
      : [],
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

  const anchor = payload.anchor;
  const anchorRect = payload.anchorRect;
  const pad = 12;
  const { panelRef, pos, desiredWidth } = useQuickMenuPosition({
    scopeRef,
    anchor,
    anchorRect,
    pad,
  });

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
      setTaskScope(e.type === "timeBlock" ? [...(e.taskScope ?? [])] : []);
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
      setTaskScope([]);
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
  }, [onClose, panelRef]);

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
    const taskScopeLines = taskScope.map((t) => t.trim()).filter(Boolean);
    const taskScopeOpt =
      kind === "timeBlock" && taskScopeLines.length
        ? { taskScope: taskScopeLines }
        : {};
    return {
      title,
      type: kind,
      description,
      ...colorOpt,
      ...saveToGoogleOpt,
      ...taskScopeOpt,
    };
  }, [
    kind,
    linkedTask,
    taskSummarySnapshot,
    title,
    description,
    eventColorHex,
    googleCalendarConnected,
    commonCreateDestination,
    taskScope,
  ]);

  const participantSuggest = useMemo(
    () => getCalendarParticipantSuggest(isTask, participantsText),
    [isTask, participantsText],
  );

  const handleOpenFull = () => {
    if (payload.mode === "existing") {
      const participants = parseParticipantCsv(participantsText);
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
                taskScope: taskScope.map((t) => t.trim()).filter(Boolean),
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
    payload.mode === "existing" &&
    payload.event.id.startsWith(GOOGLE_CALENDAR_EVENT_ID_PREFIX);

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
      taskScope: e.type === "timeBlock" ? [...(e.taskScope ?? [])] : [],
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
            reminderMinutes !== initialSnapshot.reminderMinutes ||
            (kind === "timeBlock" &&
              JSON.stringify(taskScope) !==
                JSON.stringify(initialSnapshot.taskScope)))) ||
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

    const participants = parseParticipantCsv(participantsText);
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
            ...(kind === "timeBlock"
              ? {
                  taskScope: taskScope.map((x) => x.trim()).filter(Boolean),
                }
              : {}),
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

    const participants = parseParticipantCsv(participantsText);
    const reminder =
      reminderMinutes.trim() && !Number.isNaN(Number(reminderMinutes))
        ? Number(reminderMinutes)
        : undefined;

    const taskScopeCreateLines = taskScope.map((t) => t.trim()).filter(Boolean);

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
              ...(taskScopeCreateLines.length
                ? { taskScope: taskScopeCreateLines }
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
            ref={panelRef as LegacyRef<HTMLDivElement>}
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
            <QuickMenuHeader
              payload={payload}
              kindSelectId={kindSelectId}
              kind={kind}
              lockImportedCommonKind={lockImportedCommonKind}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              slotPreview24h={slotPreview24h}
              onKindChange={(next) => {
                if (next !== "common") setCommonCreateDestination("internal");
                if (next === "task") setTaskScope([]);
                setKind(next);
              }}
              onDuplicate={onDuplicate}
              onDeleteEvent={onDeleteEvent}
              onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
              onClose={onClose}
              onDisplayTimes24hChange={onDisplayTimes24hChange}
              onOpenFullEditor={handleOpenFull}
            />
            <QuickMenuBody
              payload={payload}
              section={section}
              sectionTitleClass={sectionTitleClass}
              isTask={isTask}
              isGuest={isGuest}
              isGoogleImported={isGoogleImported}
              email={email}
              kind={kind}
              googleCalendarConnected={googleCalendarConnected}
              commonCreateDestination={commonCreateDestination}
              setCommonCreateDestination={setCommonCreateDestination}
              title={title}
              setTitle={setTitle}
              colorFillPreview={colorFillPreview}
              setEventColorHex={setEventColorHex}
              taskBoardId={taskBoardId}
              taskId={taskId}
              setTaskBoardId={setTaskBoardId}
              setTaskId={setTaskId}
              setTaskSummarySnapshot={setTaskSummarySnapshot}
              allDay={allDay}
              startValue={startValue}
              setStartValue={setStartValue}
              endValue={endValue}
              setEndValue={setEndValue}
              timeRow={timeRow}
              duration={duration}
              dateLine={dateLine}
              description={description}
              setDescription={setDescription}
              timeZone={timeZone}
              setTimeZone={setTimeZone}
              repeat={repeat}
              setRepeat={setRepeat}
              participantsText={participantsText}
              setParticipantsText={setParticipantsText}
              participantsFocused={participantsFocused}
              setParticipantsFocused={setParticipantsFocused}
              participantSuggest={participantSuggest}
              meetingUrl={meetingUrl}
              setMeetingUrl={setMeetingUrl}
              notes={notes}
              setNotes={setNotes}
              taskScope={taskScope}
              setTaskScope={setTaskScope}
              reminderMinutes={reminderMinutes}
              setReminderMinutes={setReminderMinutes}
              onRsvpChange={onRsvpChange}
              showDeclineField={showDeclineField}
              setShowDeclineField={setShowDeclineField}
              declineReason={declineReason}
              setDeclineReason={setDeclineReason}
              applyRsvp={applyRsvp}
            />
            <QuickMenuFooter
              payload={payload}
              isTask={isTask}
              isDirty={isDirty}
              taskBoardId={taskBoardId}
              taskId={taskId}
              taskSummarySnapshot={taskSummarySnapshot}
              linkedTask={linkedTask}
              onClose={onClose}
              onSaveExisting={handleSave}
              onCreateDraft={handleCreateInstant}
            />
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
