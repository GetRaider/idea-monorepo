"use client";

import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { CalendarIcon } from "@/components/Icons";
import { tasksHelper } from "@/helpers/task.helper";
import { cn } from "@/lib/styles/utils";

import { MetadataIcon, MetadataItem } from "./TaskMetadata/TaskMetadata.ui";
import { SidebarValueButton } from "./TaskView.ui";

const POPOVER_ESTIMATE_H = 88;
const POPOVER_W = 248;

function parseTimestamp(raw: Date | string | undefined): Date | undefined {
  if (raw == null) return undefined;
  const d = tasksHelper.date.parse(raw);
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
}

export interface TaskSchedulePickerProps {
  /** Stored as a DB `timestamp` — date and time are both supported. */
  value: Date | undefined;
  onChange: (next: Date | null) => void;
  variant: "metadata" | "sidebar";
  emptyLabel: string;
  /** Stronger calendar affordance (e.g. schedule vs due). */
  emphasize?: boolean;
  triggerTitle?: string;
  disabled?: boolean;
}

export function TaskSchedulePicker({
  value,
  onChange,
  variant,
  emptyLabel,
  emphasize = false,
  triggerTitle = "Choose date and time",
  disabled = false,
}: TaskSchedulePickerProps) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [pos, setPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const syncDraftFromProp = useCallback(() => {
    const d = parseTimestamp(value);
    if (d) {
      setDay(tasksHelper.date.formatForInput(d));
      setTime(tasksHelper.date.formatTimeHmForInput(d));
    } else {
      setDay("");
      setTime("");
    }
  }, [value]);

  const measure = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = r.left;
    if (left + POPOVER_W > window.innerWidth - 8) {
      left = window.innerWidth - 8 - POPOVER_W;
    }
    left = Math.max(8, left);
    let top = r.bottom + 6;
    if (top + POPOVER_ESTIMATE_H > window.innerHeight - 8) {
      top = r.top - 6 - POPOVER_ESTIMATE_H;
    }
    top = Math.max(8, top);
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    syncDraftFromProp();
    measure();
  }, [open, syncDraftFromProp, measure]);

  useEffect(() => {
    if (!open) return;
    const onScrollResize = () => measure();
    window.addEventListener("resize", onScrollResize);
    window.addEventListener("scroll", onScrollResize, true);
    return () => {
      window.removeEventListener("resize", onScrollResize);
      window.removeEventListener("scroll", onScrollResize, true);
    };
  }, [open, measure]);

  const commitAndClose = useCallback(() => {
    const prev = parseTimestamp(value);
    if (!day.trim()) {
      if (prev) onChange(null);
      setOpen(false);
      return;
    }
    const next = tasksHelper.date.mergeCalendarDayAndTime(day, time || "00:00");
    if (!next || Number.isNaN(next.getTime())) {
      setOpen(false);
      return;
    }
    if (prev && prev.getTime() === next.getTime()) {
      setOpen(false);
      return;
    }
    onChange(next);
    setOpen(false);
  }, [day, time, value, onChange]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      commitAndClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open, commitAndClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") commitAndClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, commitAndClose]);

  const label = value
    ? tasksHelper.date.formatScheduleWithTime(value)
    : emptyLabel;

  const toggle = () => {
    if (disabled) return;
    if (open) {
      commitAndClose();
      return;
    }
    syncDraftFromProp();
    setOpen(true);
  };

  const inputClass =
    "min-w-0 rounded-md border border-input-border bg-input-bg px-2 py-1.5 text-xs text-text-primary outline-none transition-[border-color] duration-200 focus:border-accent-primary";

  const triggerContent = (
    <>
      {variant === "metadata" ? (
        <MetadataIcon>
          <CalendarIcon size={14} showDot={emphasize} />
        </MetadataIcon>
      ) : (
        <CalendarIcon size={13} showDot={emphasize} />
      )}
      <span className="min-w-0 truncate text-left">{label}</span>
      <ChevronDown
        size={14}
        className={cn(
          "shrink-0 text-zinc-500 transition-transform",
          open && "rotate-180",
        )}
        aria-hidden
      />
    </>
  );

  const trigger =
    variant === "sidebar" ? (
      <SidebarValueButton
        type="button"
        disabled={disabled}
        onClick={toggle}
        title={triggerTitle}
        className="max-w-full"
      >
        {triggerContent}
      </SidebarValueButton>
    ) : (
      <MetadataItem
        type="button"
        disabled={disabled}
        onClick={toggle}
        title={triggerTitle}
        className="max-w-full"
      >
        {triggerContent}
      </MetadataItem>
    );

  const popover =
    open && pos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            data-dropdown-portal
            className="fixed z-[1200] rounded-lg border border-border-app bg-background-primary p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
            style={{
              top: pos.top,
              left: pos.left,
              width: POPOVER_W,
            }}
          >
            <div className="flex flex-nowrap items-center gap-2">
              <input
                type="date"
                className={cn(inputClass, "w-[118px] shrink-0")}
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
              <input
                type="time"
                step={60}
                className={cn(inputClass, "w-[92px] shrink-0")}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={wrapRef} className="min-w-0 max-w-full">
      {trigger}
      {popover}
    </div>
  );
}
