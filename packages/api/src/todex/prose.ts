import { z } from "zod";

import { DocMentionTarget } from "./enums.ts";

const MAX_PROSE_NODES = 2000;
const MAX_PROSE_DEPTH = 32;
const BLOCK_NODE_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "listItem",
  "taskItem",
]);

export const EMPTY_PROSE_DOC: ProseDoc = { type: "doc", content: [] };

export function collectMentions(doc: ProseDoc): DocMentionRef[] {
  const mentions: DocMentionRef[] = [];
  walkProse(doc, (node) => {
    const mention = readMention(node);
    if (mention) mentions.push(mention);
  });
  return mentions;
}

export function projectProse(
  doc: ProseDoc,
  keep: (mention: DocMentionRef) => boolean,
  labelFor: (mention: DocMentionRef) => string,
): ProjectedProse {
  const projected = stripMentions(doc, keep);
  return {
    doc: projected,
    plainText: renderProse(projected, labelFor)
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  };
}

const ProseMarkSchema = z.object({
  type: z.string().trim().min(1).max(64),
  attrs: z.record(z.string(), z.unknown()).optional(),
});

export const ProseNodeSchema: z.ZodType<ProseNode> = z.lazy(() =>
  z.object({
    type: z.string().trim().min(1).max(64),
    attrs: z.record(z.string(), z.unknown()).optional(),
    text: z.string().max(20_000).optional(),
    marks: z.array(ProseMarkSchema).max(20).optional(),
    content: z.array(ProseNodeSchema).max(500).optional(),
  }),
);

export const ProseDocSchema = z
  .object({
    type: z.literal("doc"),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(ProseNodeSchema).max(500).optional(),
  })
  .superRefine((doc, context) => {
    let count = 0;
    let stopped = false;
    walkProse(doc, (node, depth) => {
      if (stopped) return false;
      count += 1;
      if (count > MAX_PROSE_NODES) {
        context.addIssue({
          code: "custom",
          message: "Document is too large",
        });
        stopped = true;
        return false;
      }
      if (depth > MAX_PROSE_DEPTH) {
        context.addIssue({
          code: "custom",
          message: "Document is nested too deeply",
        });
        stopped = true;
        return false;
      }
      if (node.type === "mention" && !readMention(node)) {
        context.addIssue({
          code: "custom",
          message: "Mention is missing a target",
        });
      }
      return true;
    });
  });

function stripMentions(
  doc: ProseDoc,
  keep: (mention: DocMentionRef) => boolean,
): ProseDoc {
  return {
    type: "doc",
    ...(doc.attrs ? { attrs: doc.attrs } : {}),
    content: (doc.content ?? []).flatMap((node) => {
      const next = stripNode(node, keep);
      return next ? [next] : [];
    }),
  };
}

function stripNode(
  node: ProseNode,
  keep: (mention: DocMentionRef) => boolean,
): ProseNode | null {
  if (node.type === "mention") {
    const mention = readMention(node);
    if (!mention || !keep(mention)) return null;
    return {
      type: "mention",
      attrs: {
        targetType: mention.targetType,
        targetId: mention.targetId,
        ...(mention.label ? { label: mention.label } : {}),
      },
    };
  }

  const next: ProseNode = { type: node.type };
  if (node.attrs) next.attrs = node.attrs;
  if (node.text !== undefined) next.text = node.text;
  if (node.marks) next.marks = node.marks;
  if (node.content) {
    next.content = node.content.flatMap((child) => {
      const stripped = stripNode(child, keep);
      return stripped ? [stripped] : [];
    });
  }
  return next;
}

function renderProse(
  doc: ProseDoc,
  labelFor: (mention: DocMentionRef) => string,
): string {
  return (doc.content ?? []).map((node) => renderNode(node, labelFor)).join("");
}

function renderNode(
  node: ProseNode,
  labelFor: (mention: DocMentionRef) => string,
): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  if (node.type === "mention") {
    const mention = readMention(node);
    return mention ? labelFor(mention) : "";
  }
  const inner = (node.content ?? [])
    .map((child) => renderNode(child, labelFor))
    .join("");
  if (BLOCK_NODE_TYPES.has(node.type)) return `${inner}\n`;
  return inner;
}

function walkProse(
  doc: ProseDoc,
  visit: (node: ProseNode | ProseDoc, depth: number) => boolean | void,
) {
  function walk(node: ProseNode | ProseDoc, depth: number): boolean {
    if (visit(node, depth) === false) return false;
    for (const child of node.content ?? []) {
      if (!walk(child, depth + 1)) return false;
    }
    return true;
  }
  walk(doc, 0);
}

function readMention(node: ProseNode | ProseDoc): DocMentionRef | null {
  if (node.type !== "mention") return null;
  const parsed = MentionAttrsSchema.safeParse(node.attrs);
  if (!parsed.success) return null;
  return {
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    ...(parsed.data.label ? { label: parsed.data.label } : {}),
  };
}

const MentionAttrsSchema = z.object({
  targetType: z.enum([
    DocMentionTarget.TASK,
    DocMentionTarget.DOC,
    DocMentionTarget.EVENT,
  ]),
  targetId: z.string().trim().min(1).max(128),
  label: z.string().trim().max(200).optional(),
});

interface ProseMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface ProseNode {
  type: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: ProseMark[];
  content?: ProseNode[];
}

export interface ProseDoc {
  type: "doc";
  attrs?: Record<string, unknown>;
  content?: ProseNode[];
}

export interface DocMentionRef {
  targetType: (typeof DocMentionTarget)[keyof typeof DocMentionTarget];
  targetId: string;
  label?: string;
}

interface ProjectedProse {
  doc: ProseDoc;
  plainText: string;
}
