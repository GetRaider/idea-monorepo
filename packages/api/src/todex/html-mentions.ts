import { DocMentionTarget } from "./enums.ts";
import type { DocMentionRef } from "./prose.ts";

const MENTION_TARGETS = new Set<string>([
  DocMentionTarget.TASK,
  DocMentionTarget.DOC,
  DocMentionTarget.EPIC,
  DocMentionTarget.EVENT,
]);

export function collectHtmlMentions(html: string): DocMentionRef[] {
  const mentions: DocMentionRef[] = [];
  const seen = new Set<string>();
  for (const tag of html.matchAll(/<(?:a|span)\b([^>]*)>/gi)) {
    const attrs = tag[1] ?? "";
    const targetType = readAttr(attrs, "data-target-type");
    const targetId = readAttr(attrs, "data-target-id");
    if (!targetType || !targetId || !MENTION_TARGETS.has(targetType)) continue;
    const key = `${targetType}:${targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    mentions.push({
      targetType: targetType as DocMentionRef["targetType"],
      targetId,
    });
  }
  return mentions;
}

function readAttr(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  const value = match?.[1]?.trim() ?? "";
  return value || null;
}
