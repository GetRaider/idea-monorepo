"use client";

import { cn } from "@/lib/styles/utils";
import type { CalendarQuickMenuPayload } from "./quickMenu.types";
import type { Task } from "@/components/Boards/KanbanBoard/types";

export type QuickMenuFooterProps = {
  payload: CalendarQuickMenuPayload;
  isTask: boolean;
  isDirty: boolean;
  taskBoardId: string;
  taskId: string;
  taskSummarySnapshot: string;
  linkedTask: Task | undefined;
  onClose: () => void;
  onSaveExisting: () => void;
  onCreateDraft: () => void;
};

export function QuickMenuFooter({
  payload,
  isTask,
  isDirty,
  taskBoardId,
  taskId,
  taskSummarySnapshot,
  linkedTask,
  onClose,
  onSaveExisting,
  onCreateDraft,
}: QuickMenuFooterProps) {
  return (
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
                  !(linkedTask?.summary?.trim() || taskSummarySnapshot.trim()))
          }
          className={cn(
            "rounded-xl border-0 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_28px_rgba(114,85,193,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] transition-[filter,opacity]",
            payload.mode === "existing"
              ? isDirty
                ? "bg-gradient-to-b from-[#8f73e8] to-[#6346c4] hover:brightness-105"
                : "cursor-not-allowed bg-gradient-to-b from-[#6b5a9e]/55 to-[#4f4278]/55 opacity-65 shadow-none"
              : "bg-gradient-to-b from-[#8f73e8] to-[#6346c4] hover:brightness-105",
          )}
          onClick={payload.mode === "existing" ? onSaveExisting : onCreateDraft}
        >
          {payload.mode === "existing" ? "Save" : "Create"}
        </button>
      </div>
    </div>
  );
}
