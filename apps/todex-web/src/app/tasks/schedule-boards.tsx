"use client";

import type { ReactNode } from "react";
import { cn } from "@repo/ui";

import { ChevronIcon } from "@components/icons";

import { STATUS_ORDER } from "./task-helpers";
import type { ScheduleBoardSection } from "./task-helpers";

export function ScheduleBoards<TBoard extends { id: string; name: string }>({
  sections,
  collapsedBoardIds,
  onToggleBoard,
  renderBoard,
}: {
  sections: ScheduleBoardSection<TBoard>[];
  collapsedBoardIds: Set<string>;
  onToggleBoard: (boardId: string) => void;
  renderBoard: (section: ScheduleBoardSection<TBoard>) => ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => {
        const expanded = !collapsedBoardIds.has(section.board.id);
        const taskCount = STATUS_ORDER.reduce(
          (count, status) => count + (section.groups[status]?.length ?? 0),
          0,
        );
        return (
          <section key={section.board.id} className="flex flex-col gap-2">
            <button
              type="button"
              aria-expanded={expanded}
              className="flex items-center gap-2 rounded-md px-1 py-1 text-left text-sm font-semibold hover:bg-surface"
              onClick={() => onToggleBoard(section.board.id)}
            >
              <ChevronIcon
                size={14}
                className={cn(
                  "text-muted-foreground transition-transform",
                  expanded && "rotate-90",
                )}
              />
              <span>{section.board.name}</span>
              <span className="text-muted-foreground">{taskCount}</span>
            </button>
            {expanded ? renderBoard(section) : null}
          </section>
        );
      })}
    </div>
  );
}
