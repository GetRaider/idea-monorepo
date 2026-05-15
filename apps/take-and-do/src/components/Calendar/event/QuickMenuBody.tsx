"use client";

import { ChevronDown } from "lucide-react";

import { Dropdown } from "@/components/Dropdown";
import { Input } from "@/components/Input";
import { cn } from "@/lib/styles/utils";
import type {
  CalendarEventType,
  CalendarRepeatValue,
  CalendarRsvpStatus,
  CalendarTimeZone,
} from "@/types/calendar.types";

import { CalendarColorPickerPopover } from "../shared/ColorPickerPopover";
import { CalendarEventTaskScopeSection } from "../shared/TaskScopeSection";
import { CalendarEventTaskSection } from "../shared/TaskSection";
import { calendarCommonEventUsesGoogleCalendar } from "@/helpers/calendar/calendar-event-mapper";
import {
  joinDatetimeLocalParts,
  splitDatetimeLocalParts,
} from "@/helpers/calendar/calendar-event-quick-menu-format";
import type {
  CalendarQuickMenuPayload,
  CommonCreateDestination,
} from "./quickMenu.types";
import { parseParticipantCsv } from "./quickMenuParticipants";
import { timeZoneOptions } from "../shared/timezones";

export type QuickMenuBodyProps = {
  payload: CalendarQuickMenuPayload;
  section: string;
  sectionTitleClass: string;
  isTask: boolean;
  isGuest: boolean;
  isGoogleImported: boolean;
  email: string | null;
  kind: CalendarEventType;
  googleCalendarConnected?: boolean;
  commonCreateDestination: CommonCreateDestination;
  setCommonCreateDestination: (v: CommonCreateDestination) => void;
  title: string;
  setTitle: (v: string | ((p: string) => string)) => void;
  colorFillPreview: string;
  setEventColorHex: (v: string | ((p: string) => string)) => void;
  taskBoardId: string;
  taskId: string;
  setTaskBoardId: (v: string) => void;
  setTaskId: (v: string) => void;
  setTaskSummarySnapshot: (v: string) => void;
  allDay: boolean;
  startValue: string;
  setStartValue: (v: string | ((p: string) => string)) => void;
  endValue: string;
  setEndValue: (v: string | ((p: string) => string)) => void;
  timeRow: string;
  duration: string;
  dateLine: string;
  description: string;
  setDescription: (v: string) => void;
  timeZone: CalendarTimeZone;
  setTimeZone: (v: CalendarTimeZone) => void;
  repeat: CalendarRepeatValue;
  setRepeat: (v: CalendarRepeatValue) => void;
  participantsText: string;
  setParticipantsText: (v: string) => void;
  participantsFocused: boolean;
  setParticipantsFocused: (v: boolean) => void;
  participantSuggest: { token: string; list: string[] };
  meetingUrl: string;
  setMeetingUrl: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  taskScope: string[];
  setTaskScope: (v: string[]) => void;
  reminderMinutes: string;
  setReminderMinutes: (v: string) => void;
  onRsvpChange?: (
    id: string,
    rsvp: CalendarRsvpStatus,
    declineReason?: string,
  ) => void;
  showDeclineField: boolean;
  setShowDeclineField: (v: boolean) => void;
  declineReason: string;
  setDeclineReason: (v: string) => void;
  applyRsvp: (rsvp: CalendarRsvpStatus) => void;
};

export function QuickMenuBody({
  payload,
  section,
  sectionTitleClass,
  isTask,
  isGuest,
  isGoogleImported,
  email,
  kind,
  googleCalendarConnected,
  commonCreateDestination,
  setCommonCreateDestination,
  title,
  setTitle,
  colorFillPreview,
  setEventColorHex,
  taskBoardId,
  taskId,
  setTaskBoardId,
  setTaskId,
  setTaskSummarySnapshot,
  allDay,
  startValue,
  setStartValue,
  endValue,
  setEndValue,
  timeRow,
  duration,
  dateLine,
  description,
  setDescription,
  timeZone,
  setTimeZone,
  repeat,
  setRepeat,
  participantsText,
  setParticipantsText,
  participantsFocused,
  setParticipantsFocused,
  participantSuggest,
  meetingUrl,
  setMeetingUrl,
  notes,
  setNotes,
  taskScope,
  setTaskScope,
  reminderMinutes,
  setReminderMinutes,
  onRsvpChange,
  showDeclineField,
  setShowDeclineField,
  declineReason,
  setDeclineReason,
  applyRsvp,
}: QuickMenuBodyProps) {
  return (
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
          <div className="min-w-0">
            <CalendarEventTaskSection
              taskBoardId={taskBoardId}
              taskId={taskId}
              isGuest={isGuest}
              inputClass=""
              sectionClassName="gap-2"
              boardTrailing={
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
              }
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

      <div className={cn(section, "border-b border-white/[0.05] space-y-2")}>
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
                    onChange={(e) => setParticipantsText(e.target.value)}
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
                  {participantsFocused && participantSuggest.list.length ? (
                    <div className="mt-1 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]">
                      {participantSuggest.list.map((p) => (
                        <button
                          key={p}
                          type="button"
                          className="block w-full truncate px-3 py-2 text-left text-xs text-zinc-200 hover:bg-white/[0.06]"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            const existing =
                              parseParticipantCsv(participantsText);
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
                  <p className="m-0 text-xs font-medium text-zinc-500">Notes</p>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes"
                    className="rounded-xl border-white/[0.08] bg-white/[0.04] text-sm text-zinc-200 placeholder:text-zinc-600"
                    maxLength={256}
                  />
                </div>

                {kind === "timeBlock" ? (
                  <CalendarEventTaskScopeSection
                    value={taskScope}
                    onChange={setTaskScope}
                    disabled={isGuest}
                    className="p-3"
                  />
                ) : null}

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
                  </div>
                ) : null}
              </>
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}
