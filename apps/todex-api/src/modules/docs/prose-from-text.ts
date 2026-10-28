import type { ProseDoc } from "@repo/api/todex";

export function proseFromText(text: string): ProseDoc {
  const trimmed = text.trim();
  if (!trimmed) return { type: "doc", content: [] };
  return {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: trimmed }] },
    ],
  };
}
