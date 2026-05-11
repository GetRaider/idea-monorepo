"use client";

import type { CalendarApi } from "@fullcalendar/core";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/styles/utils";

const VIEW_LABELS: Record<string, string> = {
  timeGridDay: "Day",
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

const menuItem =
  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-100 transition-colors hover:bg-white/[0.06]";
const menuHint = "text-xs tabular-nums text-zinc-500";
const submenuPanel =
  "absolute left-full top-0 z-10 ml-1 min-w-[160px] rounded-xl border border-white/10 bg-[#1c1c22] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)]";

export type CalendarToolbarMeta = {
  headline: string;
  rangeLabel: string;
  badgeMonth: string;
  badgeDay: string;
};

interface CalendarPlanningToolbarProps {
  getApi: () => CalendarApi | null;
  activeViewType: string;
  toolbarMeta?: CalendarToolbarMeta | null;
  slotTime24h: boolean;
  onSlotTime24hChange: (next: boolean) => void;
}

export function CalendarPlanningToolbar({
  getApi,
  activeViewType,
  toolbarMeta,
  slotTime24h,
  onSlotTime24hChange,
}: CalendarPlanningToolbarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [subDays, setSubDays] = useState(false);
  const [subSettings, setSubSettings] = useState(false);

  const closeAll = useCallback(() => {
    setOpen(false);
    setSubDays(false);
    setSubSettings(false);
  }, []);

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
        api.changeView("timeGridWeek");
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
    getApi()?.changeView(name);
    closeAll();
  };

  const goToday = () => {
    getApi()?.today();
    closeAll();
  };

  const goPrev = () => {
    getApi()?.prev();
    closeAll();
  };

  const goNext = () => {
    getApi()?.next();
    closeAll();
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
              <span className="mt-1.5 text-[1.35rem] font-bold tabular-nums leading-none tracking-tight text-white">
                {toolbarMeta.badgeDay}
              </span>
            </div>
          ) : null}
          <div className="min-w-0 pb-0.5">
            {toolbarMeta ? (
              <>
                <p className="m-0 text-lg font-semibold tracking-tight text-white sm:text-xl">
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
              onClick={() => {
                setOpen((v) => !v);
                setSubDays(false);
                setSubSettings(false);
              }}
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
                className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[240px] rounded-xl border border-white/[0.08] bg-[#1c1c22] py-1 shadow-[0_16px_48px_rgba(0,0,0,0.5)] sm:left-0 sm:right-auto"
              >
                <button
                  type="button"
                  role="menuitem"
                  className={menuItem}
                  onClick={() => changeView("timeGridDay")}
                >
                  <span>Day</span>
                  <span className={menuHint}>1 or D</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={menuItem}
                  onClick={() => changeView("timeGridWeek")}
                >
                  <span>Week</span>
                  <span className={menuHint}>0 or W</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={menuItem}
                  onClick={() => changeView("dayGridMonth")}
                >
                  <span>Month</span>
                  <span className={menuHint}>M</span>
                </button>

                <div className="my-1 h-px bg-white/[0.08]" />

                <div className="relative">
                  <button
                    type="button"
                    className={menuItem}
                    onMouseEnter={() => {
                      setSubDays(true);
                      setSubSettings(false);
                    }}
                    onClick={() => setSubDays((s) => !s)}
                  >
                    <span>Number of days</span>
                    <ChevronRight
                      size={16}
                      className="text-zinc-500"
                      aria-hidden
                    />
                  </button>
                  {subDays ? (
                    <div
                      className={submenuPanel}
                      onMouseLeave={() => setSubDays(false)}
                    >
                      {(
                        [
                          ["timeGridTwoDay", "2 days"],
                          ["timeGridThreeDay", "3 days"],
                          ["timeGridFourDay", "4 days"],
                          ["timeGridFiveDay", "5 days"],
                        ] as const
                      ).map(([view, label]) => (
                        <button
                          key={view}
                          type="button"
                          className={cn(
                            menuItem,
                            activeViewType === view && "bg-white/[0.08]",
                          )}
                          onClick={() => changeView(view)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className={menuItem}
                    onMouseEnter={() => {
                      setSubSettings(true);
                      setSubDays(false);
                    }}
                    onClick={() => setSubSettings((s) => !s)}
                  >
                    <span>View settings</span>
                    <ChevronRight
                      size={16}
                      className="text-zinc-500"
                      aria-hidden
                    />
                  </button>
                  {subSettings ? (
                    <div
                      className={submenuPanel}
                      onMouseLeave={() => setSubSettings(false)}
                    >
                      <div className="px-3 py-2 text-xs text-zinc-500">
                        Slots shown: full day (0:00–24:00)
                      </div>
                      <div className="px-3 py-2 text-xs text-zinc-500">
                        First day of week: Monday
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center rounded-xl border border-white/[0.08] bg-black/25 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <button
              type="button"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.07] hover:text-white"
              onClick={goToday}
            >
              Today
            </button>
            <div className="mx-0.5 h-6 w-px bg-white/10" aria-hidden />
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white"
              aria-label="Previous period"
              onClick={goPrev}
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white"
              aria-label="Next period"
              onClick={goNext}
            >
              <ChevronRight size={18} aria-hidden />
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
                  ? "bg-white/[0.1] text-white"
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
                  ? "bg-white/[0.1] text-white"
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
