"use client";

import { useQuery } from "@tanstack/react-query";
import { DocMentionTarget } from "@repo/api/todex";
import { cn } from "@repo/ui";

import { todexClient } from "@lib/todex-client";

import { mentionHref, type MentionCandidate, type MentionMenuEntry } from "./editor-mentions";

export function MentionMenu({
  activeIndex,
  items,
  top,
  left,
  emptyLabel,
  onSelect,
}: MentionMenuProps) {
  return (
    <div
      className="absolute z-50 max-h-80 w-72 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-md"
      style={{ top, left }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {items.length === 0 ? (
        <p className="px-2.5 py-2 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        items.map((item, itemIndex) => (
          <button
            key={mentionItemKey(item)}
            type="button"
            className={cn(
              "flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-popover-foreground hover:bg-surface",
              itemIndex === activeIndex && "bg-surface",
            )}
            onClick={() => onSelect(item)}
          >
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {item.kind === "scope" ? `@${item.token}` : item.hint}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

export function useMentionCandidates(excludeDocId?: string): MentionCandidate[] {
  const tasksQuery = useQuery({
    queryKey: ["tasks", "workspace"],
    queryFn: listWorkspaceTasks,
  });
  const docsQuery = useQuery({
    queryKey: ["docs"],
    queryFn: () => todexClient.docs.list(),
  });
  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: () => todexClient.boards.list(),
  });
  const tasks = (tasksQuery.data ?? []).map((task) => {
    const boardName = boardsQuery.data?.find(
      (board) => board.id === task.taskBoardId,
    )?.name;
    return {
      targetType: DocMentionTarget.TASK,
      id: task.id,
      label: task.summary,
      hint: task.taskKey,
      href: mentionHref({
        targetType: DocMentionTarget.TASK,
        targetId: task.id,
        taskKey: task.taskKey,
        boardName,
      }),
    };
  });
  const docs = (docsQuery.data ?? []).flatMap((doc) =>
    doc.id === excludeDocId
      ? []
      : [
          {
            targetType: DocMentionTarget.DOC,
            id: doc.id,
            label: doc.title,
            hint: doc.type === "goal" ? "Goal" : "Doc",
            href: mentionHref({
              targetType: DocMentionTarget.DOC,
              targetId: doc.id,
            }),
          },
        ],
  );
  return [...tasks, ...docs];
}

export async function listWorkspaceTasks() {
  const boards = await todexClient.boards.list();
  const groups = await Promise.all(
    boards.map((board) => todexClient.tasks.list({ boardId: board.id })),
  );
  return groups.flat();
}

function mentionItemKey(item: MentionMenuEntry) {
  if (item.kind === "scope") return `scope:${item.token}`;
  return `${item.targetType}:${item.id}`;
}

interface MentionMenuProps {
  activeIndex: number;
  items: MentionMenuEntry[];
  top: number;
  left: number;
  emptyLabel: string;
  onSelect: (item: MentionMenuEntry) => void;
}
