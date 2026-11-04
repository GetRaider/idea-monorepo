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
  options?: MentionMenuOptions,
): MentionMenuEntry[] {
  const includeEvents = options?.includeEvents !== false;
  const scopes = includeEvents
    ? MENTION_SCOPES
    : MENTION_SCOPES.filter(
        (scope) => scope.targetType !== DocMentionTarget.EVENT,
      );
  const visibleCandidates = includeEvents
    ? candidates
    : candidates.filter(
        (candidate) => candidate.targetType !== DocMentionTarget.EVENT,
      );
  const parsed = parseMentionQuery(query, scopes);
  if (parsed.scope) {
    return visibleCandidates
      .filter(
        (candidate) =>
          candidate.targetType === parsed.scope &&
          matchesMention(candidate, parsed.search),
      )
      .slice(0, MENTION_RESULT_LIMIT)
      .map(targetEntry);
  }
  if (parsed.showScopes) {
    return scopes
      .filter((scope) => scope.token.startsWith(query.toLowerCase()))
      .map((scope) => ({
        kind: "scope" as const,
        token: scope.token,
        label: scope.label,
      }));
  }
  return visibleCandidates
    .filter((candidate) => matchesMention(candidate, query))
    .slice(0, MENTION_RESULT_LIMIT)
    .map(targetEntry);
}

export function mentionEmptyLabel(query: string): string {
  const parsed = parseMentionQuery(query, MENTION_SCOPES);
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
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent(`@${entry.token}`)
      .run();
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
    return `/knowledge/${input.targetId}`;
  }
  if (input.targetType === DocMentionTarget.EVENT) {
    return `/planning/calendar/events/${input.targetId}`;
  }
  if (!input.taskKey || !input.spaceId) return null;
  return tasksUrlHelper.routing.buildBoardUrl(input.spaceId, input.taskKey);
}

function parseMentionQuery(
  query: string,
  scopes: readonly MentionScope[],
): ParsedMentionQuery {
  const normalized = query.toLowerCase();
  const scope = scopes.find((item) => normalized.startsWith(item.token));
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
    showScopes: scopes.some((item) => item.token.startsWith(normalized)),
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
  { token: "docs", targetType: DocMentionTarget.DOC, label: "Knowledge" },
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

interface MentionMenuOptions {
  includeEvents?: boolean;
}

type MentionScope = (typeof MENTION_SCOPES)[number];

interface MentionHrefInput {
  targetType: MentionCandidate["targetType"];
  targetId: string;
  taskKey?: string;
  spaceId?: string;
}

interface ParsedMentionQuery {
  scope: MentionCandidate["targetType"] | null;
  search: string;
  showScopes: boolean;
}
