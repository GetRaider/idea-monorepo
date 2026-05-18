"use client";

import type { Dispatch, SetStateAction } from "react";
import { MoreVertical, X } from "lucide-react";

import { Dropdown } from "@/components/Dropdown";
import { FullScreenIcon } from "@/components/Icons/FullScreenIcon";
import type { CalendarEvent, CalendarEventType } from "@/types/calendar.types";
import { cn } from "@/lib/styles/utils";

import type { CalendarQuickMenuPayload } from "./quickMenu.types";
import { kindLabel } from "@/helpers/calendar/calendar-event-mapper";

export type QuickMenuHeaderProps = {
  payload: CalendarQuickMenuPayload;
  kindSelectId: string;
  kind: CalendarEventType;
  lockImportedCommonKind: boolean;
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  slotPreview24h: boolean;
  onKindChange: (next: CalendarEventType) => void;
  onDuplicate?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  onShowDeleteConfirm: () => void;
  onClose: () => void;
  onDisplayTimes24hChange?: (next: boolean) => void;
  onOpenFullEditor: () => void;
};

export function QuickMenuHeader({
  payload,
  kindSelectId,
  kind,
  lockImportedCommonKind,
  menuOpen,
  setMenuOpen,
  slotPreview24h,
  onKindChange,
  onDuplicate,
  onDeleteEvent,
  onShowDeleteConfirm,
  onClose,
  onDisplayTimes24hChange,
  onOpenFullEditor,
}: QuickMenuHeaderProps) {
  return (
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
          onChange={onKindChange}
          fullWidth={false}
          disabled={lockImportedCommonKind}
        />
      </div>
      <div className="relative flex items-center gap-1">
        {payload.mode === "existing" && (onDuplicate || onDeleteEvent) ? (
          <div className="relative">
            <button
              type="button"
              title="More"
              className="flex h-9 w-9 items-center justify-center rounded-xl border-0 bg-transparent text-zinc-500 transition-colors hover:bg-white/[0.07] hover:text-text-primary"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreVertical size={18} strokeWidth={1.75} aria-hidden />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-10 z-[1] min-w-[140px] overflow-hidden rounded-xl border border-border-app bg-background-primary shadow-dropdown">
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
                    className="block w-full px-3 py-2 text-left text-xs font-medium text-red-500/65 hover:bg-red-950/35"
                    onClick={() => {
                      onShowDeleteConfirm();
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
                  ? "bg-white/[0.1] text-text-primary"
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
                  ? "bg-white/[0.1] text-text-primary"
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
          className="flex h-9 w-9 items-center justify-center rounded-xl border-0 bg-transparent text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-text-primary"
          onClick={onOpenFullEditor}
        >
          <FullScreenIcon size={18} className="text-current" aria-hidden />
        </button>
        <button
          type="button"
          title="Close"
          className="flex h-9 w-9 items-center justify-center rounded-xl border-0 bg-transparent text-zinc-500 transition-colors hover:bg-white/[0.07] hover:text-text-primary"
          onClick={onClose}
        >
          <X size={20} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </div>
  );
}
