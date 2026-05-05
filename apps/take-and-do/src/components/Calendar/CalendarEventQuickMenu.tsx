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
import {
  Bell,
  Clock,
  FileText,
  PanelRight,
  Users,
  Video,
  X,
} from "lucide-react";

import { Dropdown } from "@/components/Dropdown";
import { Input } from "@/components/Input";
import { cn } from "@/lib/styles/utils";
import type {
  CalendarEventKind,
  CalendarRsvpStatus,
  CalendarScheduledEvent,
} from "@/types/calendar.types";

import { kindLabel } from "./calendar-event-mapper";
import { timeZoneOptions } from "./timezones";

export type CalendarQuickMenuPayload =
  | {
      mode: "existing";
      event: CalendarScheduledEvent;
      anchor: { clientX: number; clientY: number };
    }
  | {
      mode: "draft";
      start: Date;
      end: Date;
      allDay: boolean;
      anchor: { clientX: number; clientY: number };
    };

export type CalendarOpenFullEditorContext = {
  mode: "existing" | "draft";
  event?: CalendarScheduledEvent;
  range?: { start: Date; end: Date; allDay: boolean };
  quickFields: {
    title: string;
    kind: CalendarEventKind;
    description: string;
  };
};

interface CalendarEventQuickMenuProps {
  payload: CalendarQuickMenuPayload;
  /** DOM node that bounds the popup (calendar surface). */
  scopeRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** Opens the full Create / Edit event dialog. */
  onOpenFullEditor: (context: CalendarOpenFullEditorContext) => void;
  onPersistExisting?: (
    id: string,
    patch: Partial<
      Pick<
        CalendarScheduledEvent,
        | "title"
        | "kind"
        | "description"
        | "notesAndDocs"
        | "meetingUrl"
        | "participants"
        | "timeZone"
        | "repeat"
      >
    >,
  ) => void;
  onDuplicate?: (event: CalendarScheduledEvent) => void;
  onDelete?: (id: string) => void;
  onRsvpChange?: (
    id: string,
    rsvp: CalendarRsvpStatus,
    declineReason?: string,
  ) => void;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTimeHm(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
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

export function CalendarEventQuickMenu({
  payload,
  scopeRef,
  onClose,
  onOpenFullEditor,
  onPersistExisting,
  onDuplicate,
  onDelete,
  onRsvpChange,
}: CalendarEventQuickMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const kindSelectId = useId();
  const { data: session } = useSession();

  const start =
    payload.mode === "existing" ? new Date(payload.event.start) : payload.start;
  const end =
    payload.mode === "existing" ? new Date(payload.event.end) : payload.end;
  const allDay =
    payload.mode === "existing" ? payload.event.allDay : payload.allDay;

  const [title, setTitle] = useState(() =>
    payload.mode === "existing" ? payload.event.title : "",
  );
  const [kind, setKind] = useState<CalendarEventKind>(() =>
    payload.mode === "existing" ? payload.event.kind : "time_block",
  );
  const [description, setDescription] = useState(() =>
    payload.mode === "existing" ? (payload.event.description ?? "") : "",
  );
  const [notesAndDocs, setNotesAndDocs] = useState(() =>
    payload.mode === "existing" ? (payload.event.notesAndDocs ?? "") : "",
  );
  const [meetingUrl, setMeetingUrl] = useState(() =>
    payload.mode === "existing" ? (payload.event.meetingUrl ?? "") : "",
  );
  const [participantsText, setParticipantsText] = useState(() =>
    payload.mode === "existing"
      ? (payload.event.participants ?? []).join(", ")
      : "",
  );
  const [timeZone, setTimeZone] = useState(() =>
    payload.mode === "existing" ? (payload.event.timeZone ?? "") : "",
  );
  const [repeat, setRepeat] = useState(() =>
    payload.mode === "existing" ? (payload.event.repeat ?? "") : "",
  );
  const [declineReason, setDeclineReason] = useState(() =>
    payload.mode === "existing" ? (payload.event.rsvpDeclineReason ?? "") : "",
  );
  const [showDeclineField, setShowDeclineField] = useState(
    () => payload.mode === "existing" && payload.event.rsvpStatus === "no",
  );

  useEffect(() => {
    if (payload.mode === "existing") {
      const e = payload.event;
      setTitle(e.title);
      setKind(e.kind);
      setDescription(e.description ?? "");
      setNotesAndDocs(e.notesAndDocs ?? "");
      setMeetingUrl(e.meetingUrl ?? "");
      setParticipantsText((e.participants ?? []).join(", "));
      setTimeZone(e.timeZone ?? "");
      setRepeat(e.repeat ?? "");
      setDeclineReason(e.rsvpDeclineReason ?? "");
      setShowDeclineField(e.rsvpStatus === "no");
    } else {
      setTitle("");
      setKind("time_block");
      setDescription("");
      setNotesAndDocs("");
      setMeetingUrl("");
      setParticipantsText("");
      setTimeZone("");
      setRepeat("");
      setDeclineReason("");
      setShowDeclineField(false);
    }
  }, [payload]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
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
  const pad = 12;

  const desiredWidth = useMemo(() => {
    if (typeof window === "undefined") return 380;
    const scopeWidth = scopeRef.current?.getBoundingClientRect().width;
    const max = 420;
    const min = 320;
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

      const anchorX = anchor.clientX - scopeRect.left;
      const anchorY = anchor.clientY - scopeRect.top;

      const left = Math.max(
        pad,
        Math.min(anchorX - w / 2, scopeRect.width - w - pad),
      );

      const below = anchorY + pad;
      const above = anchorY - h - pad;
      const canFitBelow = below + h + pad <= scopeRect.height;
      const canFitAbove = above >= pad;

      const top = (() => {
        if (scopeRect.height < 560 || scopeRect.width < 420) return pad;
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
  }, [anchor.clientX, anchor.clientY, desiredWidth, scopeRef]);

  const timeRow = allDay
    ? "All day"
    : `${formatTimeHm(start)} → ${formatTimeHm(end)}`;
  const duration = allDay
    ? ""
    : durationLabelMs(end.getTime() - start.getTime());
  const dateLine = formatWeekdayMonthDay(start);

  const email =
    session?.user?.email ??
    (session?.user?.name ? String(session.user.name) : null);

  const quickFields = { title, kind, description };

  const parseParticipants = (raw: string) =>
    raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

  const handleOpenFull = () => {
    if (payload.mode === "existing") {
      const participants = parseParticipants(participantsText);
      const merged: CalendarScheduledEvent = {
        ...payload.event,
        title: (title.trim() || payload.event.title).slice(0, 200),
        kind,
        ...(description.trim()
          ? { description: description.trim() }
          : { description: undefined }),
        notesAndDocs: notesAndDocs.trim() || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
        participants: participants.length ? participants : undefined,
        timeZone: timeZone.trim() || undefined,
        repeat: repeat.trim() || undefined,
      };
      onOpenFullEditor({
        mode: "existing",
        event: merged,
        quickFields,
      });
    } else {
      onOpenFullEditor({
        mode: "draft",
        range: {
          start: payload.start,
          end: payload.end,
          allDay: payload.allDay,
        },
        quickFields,
      });
    }
    onClose();
  };

  const handleDone = () => {
    if (payload.mode === "existing" && onPersistExisting) {
      const t = title.trim();
      const participants = parseParticipants(participantsText);
      if (t) {
        onPersistExisting(payload.event.id, {
          title: t.slice(0, 200),
          kind,
          description: description.trim() || undefined,
          notesAndDocs: notesAndDocs.trim() || undefined,
          meetingUrl: meetingUrl.trim() || undefined,
          participants: participants.length ? participants : undefined,
          timeZone: timeZone.trim() || undefined,
          repeat: repeat.trim() || undefined,
        });
      }
    }
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

  const section = "px-4 py-3";

  return createPortal(
    <div className="absolute inset-0 z-[4500]" role="presentation" aria-hidden>
      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby={kindSelectId}
        className={cn(
          "absolute flex max-h-[min(560px,calc(100%-24px))] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e] shadow-[var(--shadow-dialog)]",
        )}
        style={{
          left: pos?.left ?? pad,
          top: pos?.top ?? pad,
          width: pos?.width ?? desiredWidth,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-b border-white/[0.08] px-3 py-2.5",
          )}
        >
          <div className="min-w-0 flex-1">
            <Dropdown<CalendarEventKind>
              id={kindSelectId}
              options={[
                { value: "time_block", label: kindLabel("time_block") },
                { value: "general", label: kindLabel("general") },
                { value: "task_event", label: kindLabel("task_event") },
              ]}
              value={kind}
              onChange={setKind}
              fullWidth={false}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Open full editor"
              className="flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
              onClick={handleOpenFull}
            >
              <PanelRight size={20} strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              title="Close"
              className="flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent text-zinc-500 transition-colors hover:bg-white/[0.08] hover:text-white"
              onClick={onClose}
            >
              <X size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch]">
          <div className={cn(section, "border-b border-white/[0.08]")}>
            <Input
              className="rounded-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              aria-label="Title"
              maxLength={200}
            />
          </div>

          <div
            className={cn(section, "border-b border-white/[0.08] space-y-2")}
          >
            <div className="flex items-start gap-2.5">
              <Clock
                size={18}
                className="mt-0.5 shrink-0 text-zinc-500"
                strokeWidth={1.75}
              />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-sm font-semibold text-white">
                  {timeRow}
                </p>
                {duration ? (
                  <p className="m-0 mt-1 text-xs text-zinc-500">{duration}</p>
                ) : null}
                <p className="m-0 mt-1 text-xs text-zinc-400">{dateLine}</p>
              </div>
            </div>
          </div>

          <div
            className={cn(section, "border-b border-white/[0.08] space-y-3")}
          >
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
                <Dropdown<string>
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

            <div className="flex items-start gap-2.5">
              <Users size={18} className="mt-0.5 shrink-0 text-zinc-500" />
              <Input
                value={participantsText}
                onChange={(e) => setParticipantsText(e.target.value)}
                placeholder="Add participants (comma-separated)"
                className="bg-[#252525] text-sm text-zinc-200 placeholder:text-zinc-600"
                maxLength={128}
              />
            </div>

            <div className="flex items-start gap-2.5">
              <Video size={18} className="mt-0.5 shrink-0 text-zinc-500" />
              <Input
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="Meeting URL"
                className="bg-[#252525] text-sm text-zinc-200 placeholder:text-zinc-600"
                maxLength={256}
              />
            </div>

            <div className="flex items-start gap-2.5">
              <FileText size={18} className="mt-0.5 shrink-0 text-zinc-500" />
              <Input
                value={notesAndDocs}
                onChange={(e) => setNotesAndDocs(e.target.value)}
                placeholder="Notes & Docs"
                className="bg-[#252525] text-sm text-zinc-200 placeholder:text-zinc-600"
                maxLength={256}
              />
            </div>
          </div>

          <div className={cn(section, "border-b border-white/[0.08]")}>
            <p className="m-0 mb-1.5 text-xs font-medium text-zinc-500">
              Description
            </p>
            <textarea
              className="min-h-[72px] w-full resize-y rounded-lg border border-white/10 bg-[#252525] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details"
            />
          </div>

          <div
            className={cn(section, "border-b border-white/[0.08] space-y-1")}
          >
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

          <div className={cn(section, "border-b border-white/[0.08]")}>
            <div className="flex items-center gap-2.5">
              <Bell size={18} className="text-zinc-500" strokeWidth={1.75} />
              <div>
                <p className="m-0 text-sm font-medium text-zinc-200">
                  Reminders
                </p>
                <p className="m-0 mt-0.5 text-xs text-zinc-500">10min before</p>
              </div>
            </div>
          </div>

          {payload.mode === "existing" &&
          (onDuplicate || onDelete || onRsvpChange) ? (
            <div className={cn(section, "space-y-3")}>
              {(() => {
                const ev = payload.event;
                return (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {onDuplicate ? (
                        <button
                          type="button"
                          className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/[0.08]"
                          onClick={() => {
                            onDuplicate(ev);
                            onClose();
                          }}
                        >
                          Duplicate
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button
                          type="button"
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20"
                          onClick={() => {
                            onDelete(ev.id);
                            onClose();
                          }}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                    {onRsvpChange ? (
                      <>
                        <p className="m-0 text-xs font-medium uppercase tracking-wide text-zinc-500">
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
                                ev.rsvpStatus === v
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
                        {showDeclineField ? (
                          <div className="space-y-2">
                            <textarea
                              className="w-full resize-none rounded-lg border border-white/12 bg-input-bg px-2 py-2 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                              rows={2}
                              value={declineReason}
                              onChange={(e) => setDeclineReason(e.target.value)}
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
                      </>
                    ) : null}
                  </>
                );
              })()}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-white/[0.08] p-3">
          <div className="flex gap-2">
            {payload.mode === "draft" ? (
              <>
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-white/12 bg-white/[0.06] py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/[0.1]"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg border-0 bg-[#7255c1] py-2.5 text-sm font-medium text-white hover:bg-[#6346b0]"
                  onClick={handleOpenFull}
                >
                  Create
                </button>
              </>
            ) : (
              <button
                type="button"
                className="flex-1 rounded-lg border border-white/12 bg-white/[0.06] py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/[0.1]"
                onClick={handleDone}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    scopeRef.current ?? document.body,
  );
}
