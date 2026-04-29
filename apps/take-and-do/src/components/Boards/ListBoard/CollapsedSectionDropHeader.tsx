"use client";

import type { ReactNode } from "react";

import {
  collapsedSectionDroppableId,
  type ReorderDroppableData,
  useDroppable,
} from "@/lib/board-dnd";
import { cn } from "@/lib/styles/utils";
import type { TaskStatus } from "@/types/task";

interface CollapsedSectionDropHeaderProps {
  status: TaskStatus;
  insertIndex: number;
  enabled: boolean;
  children: ReactNode;
}

export function CollapsedSectionDropHeader({
  status,
  insertIndex,
  enabled,
  children,
}: CollapsedSectionDropHeaderProps) {
  const data: ReorderDroppableData = {
    type: "reorder",
    status,
    index: insertIndex,
    collapsedSectionHeader: true,
  };
  const { setNodeRef } = useDroppable({
    id: collapsedSectionDroppableId(status),
    data,
    disabled: !enabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn("relative z-20 w-full min-w-0", enabled && "min-h-[44px]")}
    >
      {children}
    </div>
  );
}
