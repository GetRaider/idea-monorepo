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
  "absolute left-full top-0 z-10 ml-1 min-w-[160px] rounded-xl border border-white/10 bg-[#262626] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)]";

interface CalendarPlanningToolbarProps {
  getApi: () => CalendarApi | null;
  activeViewType: string;
}

export function CalendarPlanningToolbar({
  getApi,
  activeViewType,
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
    <div
      ref={rootRef}
      className="mb-3 flex flex-wrap items-center gap-2 sm:gap-2.5"
    >
      <div className="relative">
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/[0.1]",
            open && "border-[var(--focus-ring)]/50 bg-white/[0.09]",
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
            className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[240px] rounded-xl border border-white/10 bg-[#262626] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
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
                <ChevronRight size={16} className="text-zinc-500" aria-hidden />
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
                <ChevronRight size={16} className="text-zinc-500" aria-hidden />
              </button>
              {subSettings ? (
                <div
                  className={submenuPanel}
                  onMouseLeave={() => setSubSettings(false)}
                >
                  <div className="px-3 py-2 text-xs text-zinc-500">
                    Slots shown: 6:00–22:00 (app default)
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

      <button
        type="button"
        className="rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/[0.1]"
        onClick={goToday}
      >
        Today
      </button>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
          aria-label="Previous period"
          onClick={goPrev}
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
          aria-label="Next period"
          onClick={goNext}
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}
