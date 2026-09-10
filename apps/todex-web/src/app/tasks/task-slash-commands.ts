export const SLASH_COMMANDS: SlashCommandDefinition[] = [
  {
    title: "Text",
    aliases: ["text", "paragraph", "normal"],
    kind: "paragraph",
  },
  {
    title: "Heading 1",
    shortcut: "H1",
    aliases: ["h1", "heading", "heading1", "title"],
    kind: "heading2",
  },
  {
    title: "Heading 2",
    shortcut: "H2",
    aliases: ["h2", "heading2", "subtitle"],
    kind: "heading3",
  },
  {
    title: "Heading 3",
    shortcut: "H3",
    aliases: ["h3", "heading3"],
    kind: "heading4",
  },
  {
    title: "Bulleted list",
    shortcut: "•",
    aliases: ["bullet", "bulleted", "ul", "list"],
    kind: "bulletList",
  },
  {
    title: "Numbered list",
    shortcut: "1.",
    aliases: ["numbered", "ordered", "ol", "list"],
    kind: "orderedList",
  },
  {
    title: "Checklist",
    shortcut: "☑",
    aliases: ["check", "checklist", "todo", "task"],
    kind: "taskList",
  },
  {
    title: "Blockquote",
    shortcut: "“”",
    aliases: ["quote", "blockquote"],
    kind: "blockquote",
  },
  {
    title: "Code block",
    shortcut: "</>",
    aliases: ["code", "pre"],
    kind: "codeBlock",
  },
];

export function filterSlashCommands(
  query: string,
): SlashCommandDefinition[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return SLASH_COMMANDS;

  return SLASH_COMMANDS.filter((item) =>
    [item.title, ...item.aliases].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    ),
  );
}

export function matchSlashQuery(textBeforeCursor: string): string | null {
  const match = textBeforeCursor.match(/^\/([\w-]*)$/);
  return match ? match[1] : null;
}

export type SlashCommandKind =
  | "paragraph"
  | "heading2"
  | "heading3"
  | "heading4"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "blockquote"
  | "codeBlock";

export interface SlashCommandDefinition {
  title: string;
  shortcut?: string;
  aliases: string[];
  kind: SlashCommandKind;
}
