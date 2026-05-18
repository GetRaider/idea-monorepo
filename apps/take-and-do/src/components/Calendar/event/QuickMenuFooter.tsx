"use client";

import { cn } from "@/lib/styles/utils";
import {
  chromePrimaryButtonClassName,
  chromePrimaryButtonDisabledClassName,
} from "@/lib/styles/chrome-primary-button-classes";
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
  const isPrimaryInactive =
    payload.mode === "existing"
      ? !isDirty
      : isTask &&
        (!taskBoardId.trim() ||
          !taskId.trim() ||
          !(linkedTask?.summary?.trim() || taskSummarySnapshot.trim()));

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
          disabled={isPrimaryInactive}
          className={cn(
            isPrimaryInactive
              ? cn(
                  chromePrimaryButtonDisabledClassName,
                  "px-4 py-2 text-xs font-semibold opacity-65 shadow-none",
                )
              : cn(
                  chromePrimaryButtonClassName,
                  "px-4 py-2 text-xs font-semibold shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition-[filter,opacity]",
                ),
          )}
          onClick={payload.mode === "existing" ? onSaveExisting : onCreateDraft}
        >
          {payload.mode === "existing" ? "Save" : "Create"}
        </button>
      </div>
    </div>
  );
}
