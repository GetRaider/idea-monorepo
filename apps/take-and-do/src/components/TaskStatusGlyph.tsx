"use client";

import { CheckCircledIcon } from "@/components/Icons/CheckCircledIcon";
import { cn } from "@/lib/styles/utils";

import { TaskStatus } from "@/components/Boards/KanbanBoard/types";
import { tasksHelper } from "@/helpers/task.helper";

interface TaskStatusGlyphProps {
  status: TaskStatus;
  size?: number;
  className?: string;
}

/**
 * Unified status glyph used across the app.
 * - Done uses the shared circled check icon (per design).
 * - Other statuses keep the existing lightweight glyphs.
 */
export function TaskStatusGlyph({
  status,
  size = 14,
  className,
}: TaskStatusGlyphProps) {
  if (status === TaskStatus.DONE) {
    return <CheckCircledIcon size={size} className={className} />;
  }
  return (
    <span className={cn("inline-flex items-center justify-center", className)}>
      {tasksHelper.status.getIcon(status)}
    </span>
  );
}
