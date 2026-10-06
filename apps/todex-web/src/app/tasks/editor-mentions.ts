import type { Editor } from "@tiptap/react";
import { DocMentionTarget } from "@repo/api/todex";

import { tasksUrlHelper } from "../../helpers/tasks-url.helper";

const MENTION_RESULT_LIMIT = 20;

export function readMentionTrigger(
  textBeforeCursor: string,
): MentionTrigger | null {
  const match = textBeforeCursor.match(/(?:^|\s)@([^@]*)$/);
  if (!match || match[1] == null) return null;
  return { query: match[1], length: match[1].length + 1 };
}

export function mentionMenuItems(
  candidates: MentionCandidate[],
  query: string,
): MentionMenuEntry[] {
  const parsed = parseMentionQuery(query);
  if (parsed.scope) {
    return candidates
      .filter(
        (candidate) =>
          candidate.targetType === parsed.scope &&
          matchesMention(candidate, parsed.search),
      )
      .slice(0, MENTION_RESULT_LIMIT)
      .map(targetEntry);
  }
  if (parsed.showScopes) {
    return MENTION_SCOPES.filter((scope) =>
      scope.token.startsWith(query.toLowerCase()),
    ).map((scope) => ({
      kind: "scope",
      token: scope.token,
      label: scope.label,
    }));
  }
  return candidates
    .filter((candidate) => matchesMention(candidate, query))
    .slice(0, MENTION_RESULT_LIMIT)
    .map(targetEntry);
}

export function mentionEmptyLabel(query: string): string {
  const parsed = parseMentionQuery(query);
  if (parsed.scope === DocMentionTarget.EVENT) return "No events";
  if (parsed.scope === DocMentionTarget.TASK) return "No tasks";
  if (parsed.scope === DocMentionTarget.DOC) return "No docs";
  return "Nothing matches";
}

export function applyMentionEntry(
  editor: Editor,
  range: { from: number; to: number },
  entry: MentionMenuEntry,
) {
  if (entry.kind === "scope") {
    editor.chain().focus().deleteRange(range).insertContent(`@${entry.token}`).run();
    return;
  }
  const label = entry.hint ? `${entry.hint} ${entry.label}` : entry.label;
  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertContent({
      type: "mention",
      attrs: {
        targetType: entry.targetType,
        targetId: entry.id,
        label,
        href: entry.href,
      },
    })
    .run();
}

export function mentionHref(input: MentionHrefInput): string | null {
  if (input.targetType === DocMentionTarget.DOC) {
    return `/docs/${input.targetId}`;
  }
  if (input.targetType === DocMentionTarget.EVENT) {
    return `/calendar/events/${input.targetId}`;
  }
  if (!input.taskKey || !input.boardName) return null;
  return tasksUrlHelper.routing.buildBoardUrl(input.boardName, input.taskKey);
}

function parseMentionQuery(query: string): ParsedMentionQuery {
  const normalized = query.toLowerCase();
  const scope = MENTION_SCOPES.find((item) => normalized.startsWith(item.token));
  if (scope) {
    return {
      scope: scope.targetType,
      search: query.slice(scope.token.length).trim(),
      showScopes: false,
    };
  }
  return {
    scope: null,
    search: query,
    showScopes: MENTION_SCOPES.some((item) => item.token.startsWith(normalized)),
  };
}

function matchesMention(candidate: MentionCandidate, search: string) {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return [candidate.label, candidate.hint ?? ""].some((value) =>
    value.toLowerCase().includes(needle),
  );
}

function targetEntry(candidate: MentionCandidate): MentionMenuEntry {
  return {
    kind: "target",
    targetType: candidate.targetType,
    id: candidate.id,
    label: candidate.label,
    href: candidate.href,
    ...(candidate.hint ? { hint: candidate.hint } : {}),
  };
}

const MENTION_SCOPES = [
  { token: "tasks", targetType: DocMentionTarget.TASK, label: "Tasks" },
  { token: "docs", targetType: DocMentionTarget.DOC, label: "Docs" },
  { token: "events", targetType: DocMentionTarget.EVENT, label: "Events" },
] as const;

export interface MentionCandidate {
  targetType: (typeof DocMentionTarget)[keyof typeof DocMentionTarget];
  id: string;
  label: string;
  href: string | null;
  hint?: string;
}

export interface MentionTrigger {
  query: string;
  length: number;
}

export type MentionMenuEntry =
  | { kind: "scope"; token: string; label: string }
  | {
      kind: "target";
      targetType: MentionCandidate["targetType"];
      id: string;
      label: string;
      href: string | null;
      hint?: string;
    };

interface MentionHrefInput {
  targetType: MentionCandidate["targetType"];
  targetId: string;
  taskKey?: string;
  boardName?: string;
}

interface ParsedMentionQuery {
  scope: MentionCandidate["targetType"] | null;
  search: string;
  showScopes: boolean;
}
