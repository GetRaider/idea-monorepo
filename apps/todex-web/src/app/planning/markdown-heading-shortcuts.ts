import { Extension, textblockTypeInputRule } from "@tiptap/core";

// The page title is the only h1, so "Heading 1" in the UI is an h2. Map Markdown
// shortcuts to the same levels: "# " → h2, "## " → h3, "### " → h4. Runs before
// StarterKit's own heading rule, whose levels are offset by one.
export const MARKDOWN_HEADING_PATTERN = /^(#{1,3})\s$/;
export function markdownHeadingLevel(hashes: string): 2 | 3 | 4 {
  return (hashes.length + 1) as 2 | 3 | 4;
}
export const MarkdownHeadingShortcuts = Extension.create({
  name: "markdownHeadingShortcuts",
  priority: 1000,
  addInputRules() {
    const heading = this.editor.schema.nodes.heading;
    if (!heading) return [];
    return [textblockTypeInputRule({
      find: MARKDOWN_HEADING_PATTERN,
      type: heading,
      getAttributes: (match) => ({ level: markdownHeadingLevel(match[1] ?? "#") }),
    })];
  },
});
