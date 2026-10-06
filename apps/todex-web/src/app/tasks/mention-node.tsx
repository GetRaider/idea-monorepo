"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { DocMentionTarget } from "@repo/api/todex";

import { todexClient } from "@lib/todex-client";

import { mentionHref } from "./editor-mentions";
import { listWorkspaceTasks } from "./editor-mentions.ui";

export const MentionNode = Node.create({
  name: "mention",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      targetType: {
        default: DocMentionTarget.TASK,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-target-type"),
      },
      targetId: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-target-id"),
      },
      label: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-label"),
      },
      href: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("href"),
      },
    };
  },

  parseHTML() {
    return [
      { tag: "a[data-target-type][data-target-id]" },
      { tag: "span[data-target-type][data-target-id]" },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const label = String(node.attrs.label || "mention");
    const href = typeof node.attrs.href === "string" ? node.attrs.href : null;
    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        ...(href ? { href } : {}),
        "data-target-type": node.attrs.targetType,
        "data-target-id": node.attrs.targetId,
        "data-label": label,
      }),
      `@${label}`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionView);
  },
});

function MentionView({ node }: NodeViewProps) {
  const router = useRouter();
  const targetType = String(node.attrs.targetType ?? "");
  const targetId = String(node.attrs.targetId ?? "");
  const label = String(node.attrs.label || "mention");
  const storedHref =
    typeof node.attrs.href === "string" ? node.attrs.href : null;
  const href = useMentionHref(targetType, targetId) ?? storedHref;

  return (
    <NodeViewWrapper as="span" className="inline">
      <a
        href={href ?? undefined}
        data-target-type={targetType}
        data-target-id={targetId}
        data-label={label}
        className="rounded-md bg-surface px-1 text-foreground underline-offset-2 hover:underline"
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          if (!href) return;
          event.preventDefault();
          router.push(href);
        }}
      >
        @{label}
      </a>
    </NodeViewWrapper>
  );
}

function useMentionHref(targetType: string, targetId: string) {
  const tasksQuery = useQuery({
    queryKey: ["tasks", "workspace"],
    queryFn: listWorkspaceTasks,
  });
  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: () => todexClient.boards.list(),
  });
  if (targetType === DocMentionTarget.DOC || targetType === DocMentionTarget.EVENT) {
    return mentionHref({
      targetType,
      targetId,
    });
  }
  const task = tasksQuery.data?.find((item) => item.id === targetId);
  const boardName = boardsQuery.data?.find(
    (board) => board.id === task?.taskBoardId,
  )?.name;
  return mentionHref({
    targetType: DocMentionTarget.TASK,
    targetId,
    taskKey: task?.taskKey,
    boardName,
  });
}
