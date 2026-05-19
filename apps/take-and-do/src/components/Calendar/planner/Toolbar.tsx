"use client";

import type { CalendarApi } from "@fullcalendar/core";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/styles/utils";

export type CalendarToolbarMeta = {
  headline: string;
  rangeLabel: string;
  badgeMonth: string;
  badgeDay: string;
};

export type PlanningTimeGridSlotMinutes = 15 | 30;

interface CalendarPlanningToolbarProps {
  getApi: () => CalendarApi | null;
  activeViewType: string;
  toolbarMeta?: CalendarToolbarMeta | null;
  slotTime24h: boolean;
  onSlotTime24hChange: (next: boolean) => void;
  /** Time column step: 15′ (finer) vs 30′ (more hours visible). */
  timeGridSlotMinutes: PlanningTimeGridSlotMinutes;
  onTimeGridSlotMinutesChange: (next: PlanningTimeGridSlotMinutes) => void;
  /** After jumping to “today”, scroll the time grid so “now” is vertically centered. */
  onAlignViewToNow?: () => void;
  /** Short motion when using toolbar prev / next / today / view (not keyboard). */
  onToolbarNavigate?: (kind: "prev" | "next" | "neutral") => void;
}

export function CalendarPlanningToolbar({
  getApi,
  activeViewType,
  toolbarMeta,
  slotTime24h,
  onSlotTime24hChange,
  timeGridSlotMinutes,
  onTimeGridSlotMinutesChange,
  onAlignViewToNow,
  onToolbarNavigate,
}: CalendarPlanningToolbarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [specificDays, setSpecificDays] = useState(3);

  const closeAll = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    const n = daysFromMultiDayView(activeViewType);
    if (n !== null) setSpecificDays(n);
  }, [activeViewType]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeAll();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeAll]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      const api = getApi();
      if (!api) return;
      const k = e.key.toLowerCase();
      if (k === "d" || e.key === "1") {
        e.preventDefault();
        api.changeView("timeGridDay");
        closeAll();
      } else if (k === "w" || e.key === "0") {
        e.preventDefault();
        api.changeView("timeGridRollingWeek");
        closeAll();
      } else if (k === "m") {
        e.preventDefault();
        api.changeView("dayGridMonth");
        closeAll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [getApi, closeAll]);

  const changeView = (name: string) => {
    onToolbarNavigate?.("neutral");
    getApi()?.changeView(name);
    closeAll();
  };

  const applySpecificDays = (count: number) => {
    const view = multiDayViewForCount(count);
    if (!view) return;
    onToolbarNavigate?.("neutral");
    getApi()?.changeView(view);
    setSpecificDays(count);
  };

  const goToday = () => {
    onToolbarNavigate?.("neutral");
    const api = getApi();
    if (!api) return;
    api.today();
    closeAll();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        onAlignViewToNow?.();
      });
    });
  };

  const goPrev = () => {
    onToolbarNavigate?.("prev");
    getApi()?.prev();
    closeAll();
  };

  const goNext = () => {
    onToolbarNavigate?.("next");
    getApi()?.next();
    closeAll();
  };

  const bumpSlotMinutes = (direction: -1 | 1) => {
    onToolbarNavigate?.("neutral");
    const next: PlanningTimeGridSlotMinutes = direction < 0 ? 30 : 15;
    if (next !== timeGridSlotMinutes) {
      onTimeGridSlotMinutesChange(next);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onAlignViewToNow?.();
        });
      });
    }
  };

  const currentLabel = labelForViewType(activeViewType);

  return (
    <div ref={rootRef} className="mb-6 flex flex-col gap-4 pb-1">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          {toolbarMeta ? (
            <div
              className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-white/[0.09] bg-gradient-to-b from-white/[0.09] to-white/[0.03] px-3 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
              aria-hidden
            >
              <span className="text-[10px] font-bold leading-none tracking-[0.12em] text-zinc-400">
                {toolbarMeta.badgeMonth}
              </span>
              <span className="mt-1.5 text-[1.35rem] font-bold tabular-nums leading-none tracking-tight text-text-primary">
                {toolbarMeta.badgeDay}
              </span>
            </div>
          ) : null}
          <div className="min-w-0 pb-0.5">
            {toolbarMeta ? (
              <>
                <p className="m-0 text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
                  {toolbarMeta.headline}
                </p>
                <p className="m-0 mt-1 text-sm text-zinc-500">
                  {toolbarMeta.rangeLabel}
                </p>
              </>
            ) : (
              <p className="m-0 text-lg font-semibold text-zinc-400">
                Planning
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="relative">
            <button
              type="button"
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-3.5 text-sm font-medium text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/[0.09]",
                open && "border-[var(--focus-ring)]/45 bg-white/[0.08]",
              )}
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={() => setOpen((v) => !v)}
            >
              {currentLabel}
              <ChevronDown
                size={16}
                className={cn(
                  "text-zinc-400 transition-transform",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </button>

            {open ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+6px)] z-20 w-[200px] rounded-xl border border-border-app bg-background-primary py-1 shadow-dropdown sm:left-0 sm:right-auto"
              >
                <button
                  type="button"
                  role="menuitem"
                  className={menuItem}
                  onClick={() => changeView("timeGridDay")}
                >
                  Day
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={menuItem}
                  onClick={() => changeView("timeGridRollingWeek")}
                >
                  Week
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={menuItem}
                  onClick={() => changeView("dayGridMonth")}
                >
                  Month
                </button>

                <div className="my-1 h-px bg-white/[0.08]" />

                <div
                  role="none"
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-zinc-100"
                >
                  <span className="shrink-0">Custom Days</span>
                  <div className="flex shrink-0 items-center gap-px">
                    <button
                      type="button"
                      className={dayStepBtn}
                      aria-label="Fewer days"
                      disabled={specificDays <= 2}
                      onClick={() =>
                        applySpecificDays(Math.max(2, specificDays - 1))
                      }
                    >
                      <Minus size={14} aria-hidden />
                    </button>
                    <span className="w-5 select-none text-center text-xs tabular-nums text-zinc-300">
                      {specificDays}
                    </span>
                    <button
                      type="button"
                      className={dayStepBtn}
                      aria-label="More days"
                      disabled={specificDays >= 5}
                      onClick={() =>
                        applySpecificDays(Math.min(5, specificDays + 1))
                      }
                    >
                      <Plus size={14} aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center rounded-xl border border-white/[0.08] bg-black/25 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <button
              type="button"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.07] hover:text-text-primary"
              onClick={goToday}
            >
              Today
            </button>
            <div className="mx-0.5 h-6 w-px bg-white/10" aria-hidden />
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-text-primary"
              aria-label="Previous period"
              onClick={goPrev}
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-text-primary"
              aria-label="Next period"
              onClick={goNext}
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>

          <div
            className="flex items-center rounded-xl border border-white/[0.08] bg-black/25 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            role="group"
            aria-label="Time grid scale"
          >
            <button
              type="button"
              className={dayStepBtn}
              aria-label="Zoom out time grid (30 minute steps)"
              disabled={timeGridSlotMinutes === 30}
              onClick={() => bumpSlotMinutes(-1)}
            >
              <Minus size={14} aria-hidden />
            </button>
            <span className="min-w-[2.25rem] select-none px-1 text-center text-xs font-semibold tabular-nums text-zinc-200">
              Zoom
            </span>
            <button
              type="button"
              className={dayStepBtn}
              aria-label="Zoom in time grid (15 minute steps)"
              disabled={timeGridSlotMinutes === 15}
              onClick={() => bumpSlotMinutes(1)}
            >
              <Plus size={14} aria-hidden />
            </button>
          </div>

          <div
            className="flex items-center rounded-xl border border-white/[0.08] bg-black/25 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            role="group"
            aria-label="Time column format"
          >
            <button
              type="button"
              className={cn(
                "rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors",
                !slotTime24h
                  ? "bg-white/[0.1] text-text-primary"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200",
              )}
              onClick={() => onSlotTime24hChange(false)}
            >
              12h
            </button>
            <button
              type="button"
              className={cn(
                "rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors",
                slotTime24h
                  ? "bg-white/[0.1] text-text-primary"
                  : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200",
              )}
              onClick={() => onSlotTime24hChange(true)}
            >
              24h
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const VIEW_LABELS: Record<string, string> = {
  timeGridDay: "Day",
  timeGridRollingWeek: "Week",
  timeGridWeek: "Week",
  dayGridMonth: "Month",
  timeGridTwoDay: "2 days",
  timeGridThreeDay: "3 days",
  timeGridFourDay: "4 days",
  timeGridFiveDay: "5 days",
  listWeek: "Agenda",
};

function labelForViewType(type: string) {
  return VIEW_LABELS[type] ?? "Week";
}

function daysFromMultiDayView(type: string): number | null {
  switch (type) {
    case "timeGridTwoDay":
      return 2;
    case "timeGridThreeDay":
      return 3;
    case "timeGridFourDay":
      return 4;
    case "timeGridFiveDay":
      return 5;
    default:
      return null;
  }
}

function multiDayViewForCount(
  count: number,
):
  | "timeGridTwoDay"
  | "timeGridThreeDay"
  | "timeGridFourDay"
  | "timeGridFiveDay"
  | null {
  switch (count) {
    case 2:
      return "timeGridTwoDay";
    case 3:
      return "timeGridThreeDay";
    case 4:
      return "timeGridFourDay";
    case 5:
      return "timeGridFiveDay";
    default:
      return null;
  }
}

const menuItem =
  "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-zinc-100 transition-colors hover:bg-white/[0.06]";
const dayStepBtn =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-35";
