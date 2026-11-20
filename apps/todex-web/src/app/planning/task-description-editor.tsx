"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import { TableKit } from "@tiptap/extension-table";
import { Details, DetailsSummary, DetailsContent } from "@tiptap/extension-details";
import Image from "@tiptap/extension-image";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { ProseDocSchema, type ProseDoc } from "@repo/api/todex";
import { cn } from "@repo/ui";
import { toast } from "sonner";
import { todexClient } from "@lib/todex-client";
import { KnowledgeDatabaseNode } from "../knowledge/knowledge-database-node";
import { KnowledgeColumn, KnowledgeColumns, emptyKnowledgeColumns } from "../knowledge/knowledge-columns";
import { KnowledgeBlockControls } from "../knowledge/knowledge-block-controls";

import {
  applyMentionEntry,
  mentionEmptyLabel,
  mentionMenuItems,
  readMentionTrigger,
} from "./editor-mentions";
import { useCalendarEnabled } from "../settings/use-calendar-enabled";
import { MentionMenu, useMentionCandidates } from "./editor-mentions.ui";
import { MentionNode } from "./mention-node";
import { normalizeDescriptionHtml } from "./task-helpers";

const DESCRIPTION_PLACEHOLDER = "Type / for formatting, @ to mention";
const SLASH_MENU_MAX_HEIGHT = 320;
const SLASH_MENU_ITEM_HEIGHT = 36;
const SLASH_MENU_VERTICAL_OFFSET = 8;

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: "Text",
    aliases: ["text", "paragraph", "normal"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Heading 1",
    shortcut: "H1",
    aliases: ["h1", "heading", "heading1", "title"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 2",
    shortcut: "H2",
    aliases: ["h2", "heading2", "subtitle"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: "Heading 3",
    shortcut: "H3",
    aliases: ["h3", "heading3"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 4 }).run(),
  },
  {
    title: "Bulleted list",
    shortcut: "•",
    aliases: ["bullet", "bulleted", "ul", "list"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered list",
    shortcut: "1.",
    aliases: ["numbered", "ordered", "ol", "list"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Checklist",
    shortcut: "☑",
    aliases: ["check", "checklist", "todo", "task"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: "Blockquote",
    shortcut: "“”",
    aliases: ["quote", "blockquote"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Code block",
    shortcut: "</>",
    aliases: ["code", "pre"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
];

// Document-only block; task/goal descriptions keep their existing HTML schema.
const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      variant: {
        default: "info",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-variant") ?? "info",
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, {
      class: "todex-callout",
      "data-type": "callout",
      "data-variant": node.attrs.variant,
    }), 0];
  },
});

const DOCUMENT_SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: "Simple table",
    shortcut: "3 × 3",
    aliases: ["simple table", "table", "grid", "rows", "columns"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: "Callout",
    aliases: ["callout", "info", "note", "tip"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertContent({
        type: "callout",
        attrs: { variant: "info" },
        content: [{ type: "paragraph" }],
      }).run(),
  },
  {
    title: "Toggle",
    aliases: ["toggle", "details", "collapse", "expand"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertContent({
        type: "details",
        attrs: { open: true },
        content: [
          { type: "detailsSummary", content: [{ type: "text", text: "Toggle heading" }] },
          { type: "detailsContent", content: [{ type: "paragraph" }] },
        ],
      }).run(),
  },
  {
    title: "Two columns",
    shortcut: "2 columns",
    aliases: ["columns", "layout", "side by side", "split"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertContent(emptyKnowledgeColumns()).run(),
  },
  {
    title: "Divider",
    aliases: ["divider", "separator", "horizontal rule"],
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: "Image from URL",
    aliases: ["image", "picture", "media", "photo"],
    command: (editor, range) => {
      const src = window.prompt("Image URL (https://)");
      if (!src) return;
      try {
        const url = new URL(src);
        if (url.protocol !== "https:" && url.protocol !== "http:") return;
        editor.chain().focus().deleteRange(range)
          .setImage({ src: url.toString() }).run();
      } catch {
        // Invalid URLs are ignored; do not persist unsafe image sources.
      }
    },
  },
];

export function TaskDescriptionEditor({
  content,
  document,
  onChange,
  onDocumentChange,
  excludeDocId,
  appearance = "field",
  contentClassName,
  knowledgeMode = false,
  knowledgeSpaceId,
}: TaskDescriptionEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const onDocumentChangeRef = useRef(onDocumentChange);
  const slashKeyDownRef = useRef<(event: KeyboardEvent) => boolean>(
    () => false,
  );
  const mentionKeyDownRef = useRef<(event: KeyboardEvent) => boolean>(
    () => false,
  );
  const suppressSlashRef = useRef(false);
  const suppressMentionRef = useRef(false);
  const mentionCandidates = useMentionCandidates(excludeDocId);
  const { enabled: calendarEnabled } = useCalendarEnabled();
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [activeSlashIndex, setActiveSlashIndex] = useState(0);
  const [mentionMenu, setMentionMenu] = useState<MentionMenuState | null>(null);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  onChangeRef.current = onChange;
  onDocumentChangeRef.current = onDocumentChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      MentionNode,
      ...(knowledgeMode ? [
        TableKit.configure({ table: { resizable: true, HTMLAttributes: { class: "todex-table" } } }),
        Details.configure({ persist: true, HTMLAttributes: { class: "todex-details" } }),
        DetailsSummary,
        DetailsContent,
        Image,
        Callout,
        KnowledgeDatabaseNode,
        KnowledgeColumns,
        KnowledgeColumn,
      ] : []),
      Placeholder.configure({
        placeholder: knowledgeMode ? "Type / for blocks, @ to mention…" : DESCRIPTION_PLACEHOLDER,
      }),
    ],
    content: document ?? content,
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      const publishDocument = onDocumentChangeRef.current;
      if (publishDocument) {
        const parsed = ProseDocSchema.safeParse(nextEditor.getJSON());
        if (parsed.success) publishDocument(parsed.data);
        return;
      }
      onChangeRef.current?.(normalizeDescriptionHtml(nextEditor.getHTML()));
    },
    editorProps: {
      attributes: {
        class: cn(
          "outline-none",
          (appearance === "plain" || knowledgeMode) ? "min-h-40" : "min-h-20",
          contentClassName,
        ),
      },
      handleKeyDown: (_view, event) =>
        mentionKeyDownRef.current(event) || slashKeyDownRef.current(event),
    },
  });

  const visibleMentionItems = useMemo(
    () =>
      mentionMenu
        ? mentionMenuItems(mentionCandidates, mentionMenu.query, {
            includeEvents: calendarEnabled,
          })
        : [],
    [calendarEnabled, mentionCandidates, mentionMenu],
  );

  const slashCommands = useMemo(() => {
    if (!knowledgeMode) return SLASH_COMMANDS;
    const commands = [...SLASH_COMMANDS, ...DOCUMENT_SLASH_COMMANDS];
    if (knowledgeSpaceId) commands.push({
      title: "Database table",
      shortcut: "Properties",
      aliases: ["database", "database table", "data table", "notion", "properties"],
      command: (currentEditor, range) => {
        void todexClient.knowledgeDatabases.create({
          spaceId: knowledgeSpaceId, name: "Untitled database",
        }).then((database) => {
          if (!currentEditor.isDestroyed) {
            currentEditor.chain().focus().deleteRange(range).insertContent({
              type: "databaseView",
              attrs: { databaseId: database.id, viewId: database.view.id },
            }).run();
          }
        }).catch((error: unknown) => {
          toast.error(error instanceof Error ? error.message : "Could not create database");
        });
      },
    });
    return commands;
  }, [knowledgeMode, knowledgeSpaceId]);
  const visibleSlashItems = useMemo(() => {
    if (!slashMenu) return [];
    return slashCommands.filter((item) =>
      matchesSlashQuery(item, slashMenu.query),
    );
  }, [slashMenu, slashCommands]);

  slashKeyDownRef.current = (event) => {
    if (!slashMenu || visibleSlashItems.length === 0) return false;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSlashIndex(
        (commandIndex) => (commandIndex + 1) % visibleSlashItems.length,
      );
      return true;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSlashIndex(
        (commandIndex) =>
          (commandIndex - 1 + visibleSlashItems.length) %
          visibleSlashItems.length,
      );
      return true;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const selectedItem = visibleSlashItems[activeSlashIndex];
      if (selectedItem && editor)
        selectSlashItem(editor, slashMenu, selectedItem);
      setSlashMenu(null);
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      suppressSlashRef.current = true;
      setSlashMenu(null);
      return true;
    }
    return false;
  };

  mentionKeyDownRef.current = (event) => {
    if (!mentionMenu) return false;
    if (visibleMentionItems.length === 0) {
      if (event.key === "Escape") {
        event.preventDefault();
        suppressMentionRef.current = true;
        setMentionMenu(null);
        return true;
      }
      return false;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveMentionIndex(
        (itemIndex) => (itemIndex + 1) % visibleMentionItems.length,
      );
      return true;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveMentionIndex(
        (itemIndex) =>
          (itemIndex - 1 + visibleMentionItems.length) %
          visibleMentionItems.length,
      );
      return true;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const selectedItem = visibleMentionItems[activeMentionIndex];
      if (selectedItem && editor) {
        applyMentionEntry(editor, mentionMenu.range, selectedItem);
      }
      if (selectedItem?.kind === "target") setMentionMenu(null);
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      suppressMentionRef.current = true;
      setMentionMenu(null);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!editor) return;

    const closeSlashMenu = () => setSlashMenu(null);
    const updateSlashMenu = () => {
      const root = rootRef.current;
      if (!root || !editor.isEditable) {
        suppressSlashRef.current = false;
        closeSlashMenu();
        return;
      }
      const nextMenu = getSlashMenuState(editor, root, slashCommands);
      if (!nextMenu) suppressSlashRef.current = false;
      if (suppressSlashRef.current) {
        closeSlashMenu();
        return;
      }
      setSlashMenu(nextMenu);
    };

    updateSlashMenu();
    editor.on("update", updateSlashMenu);
    editor.on("selectionUpdate", updateSlashMenu);
    editor.on("blur", closeSlashMenu);

    return () => {
      editor.off("update", updateSlashMenu);
      editor.off("selectionUpdate", updateSlashMenu);
      editor.off("blur", closeSlashMenu);
    };
  }, [editor, slashCommands]);

  useEffect(() => {
    if (!editor) return;

    const closeMentionMenu = () => setMentionMenu(null);
    const updateMentionMenu = () => {
      const root = rootRef.current;
      if (!root || !editor.isEditable) {
        suppressMentionRef.current = false;
        closeMentionMenu();
        return;
      }
      const nextMenu = getMentionMenuState(editor, root);
      if (!nextMenu) suppressMentionRef.current = false;
      if (suppressMentionRef.current) {
        closeMentionMenu();
        return;
      }
      setMentionMenu(nextMenu);
    };

    updateMentionMenu();
    editor.on("update", updateMentionMenu);
    editor.on("selectionUpdate", updateMentionMenu);
    editor.on("blur", closeMentionMenu);

    return () => {
      editor.off("update", updateMentionMenu);
      editor.off("selectionUpdate", updateMentionMenu);
      editor.off("blur", closeMentionMenu);
    };
  }, [editor]);

  useEffect(() => {
    setActiveSlashIndex(0);
  }, [slashMenu?.query]);

  useEffect(() => {
    setActiveMentionIndex(0);
  }, [mentionMenu?.query]);

  useEffect(() => {
    if (activeSlashIndex >= visibleSlashItems.length) {
      setActiveSlashIndex(Math.max(visibleSlashItems.length - 1, 0));
    }
  }, [activeSlashIndex, visibleSlashItems.length]);

  useEffect(() => {
    if (activeMentionIndex >= visibleMentionItems.length) {
      setActiveMentionIndex(Math.max(visibleMentionItems.length - 1, 0));
    }
  }, [activeMentionIndex, visibleMentionItems.length]);

  if (!editor) {
    return (
      <div
        className={cn(
          "text-sm text-muted-foreground",
          (appearance === "plain" || knowledgeMode)
            ? "min-h-40 px-0 py-2"
            : "min-h-24 rounded-md border border-input bg-background px-3 py-2",
        )}
      >
        Loading editor…
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        knowledgeMode ? "knowledge-doc-editor relative text-base leading-7" : "relative text-sm",
        (appearance === "plain" || knowledgeMode)
          ? "bg-transparent px-0 py-1"
          : "rounded-md border border-input bg-background px-3 py-2",
        "[&_.tiptap_p]:my-1",
        "[&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none",
        "[&_.tiptap_p.is-editor-empty:first-child::before]:float-left",
        "[&_.tiptap_p.is-editor-empty:first-child::before]:h-0",
        "[&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground",
        "[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
        "[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5",
        "[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5",
        "[&_.tiptap_ul[data-type='taskList']]:list-none [&_.tiptap_ul[data-type='taskList']]:pl-0",
        "[&_.tiptap_ul[data-type='taskList']_li]:flex [&_.tiptap_ul[data-type='taskList']_li]:items-start [&_.tiptap_ul[data-type='taskList']_li]:gap-2",
        "[&_.tiptap_ul[data-type='taskList']_li_label]:flex [&_.tiptap_ul[data-type='taskList']_li_label]:h-5 [&_.tiptap_ul[data-type='taskList']_li_label]:shrink-0 [&_.tiptap_ul[data-type='taskList']_li_label]:items-center",
        "[&_.tiptap_ul[data-type='taskList']_label_span]:hidden",
        "[&_.tiptap_ul[data-type='taskList']_input]:m-0 [&_.tiptap_ul[data-type='taskList']_input]:size-3.5",
        "[&_.tiptap_ul[data-type='taskList']_li_div]:min-w-0 [&_.tiptap_ul[data-type='taskList']_li_div]:flex-1",
        "[&_.tiptap_ul[data-type='taskList']_li_p]:my-0",
        "[&_.tiptap_blockquote]:border-l-2 [&_.tiptap_blockquote]:border-border [&_.tiptap_blockquote]:pl-3",
        "[&_.tiptap_pre]:rounded-md [&_.tiptap_pre]:bg-muted [&_.tiptap_pre]:p-2",
        "[&_.tiptap_h2]:text-base [&_.tiptap_h2]:font-semibold",
        "[&_.tiptap_h3]:text-sm [&_.tiptap_h3]:font-semibold",
        "[&_.tiptap_h4]:text-sm [&_.tiptap_h4]:font-medium",
        "[&_span[data-target-type]]:rounded-md [&_span[data-target-type]]:bg-surface [&_span[data-target-type]]:px-1 [&_span[data-target-type]]:text-foreground",
        knowledgeMode && [
          "[&_.tiptap_p]:my-2",
          "[&_.tiptap_h2]:!mt-8 [&_.tiptap_h2]:!mb-3 [&_.tiptap_h2]:!text-2xl",
          "[&_.tiptap_h3]:!mt-6 [&_.tiptap_h3]:!mb-2 [&_.tiptap_h3]:!text-xl",
          "[&_.tiptap_h4]:!mt-5 [&_.tiptap_h4]:!text-lg",
          "[&_.todex-table]:w-full [&_.todex-table]:border-collapse",
          "[&_.todex-table_td]:border [&_.todex-table_th]:border",
          "[&_.todex-table_td]:border-border [&_.todex-table_th]:border-border",
          "[&_.todex-table_td]:p-2 [&_.todex-table_th]:p-2",
          "[&_.todex-table_th]:bg-surface [&_.todex-table_th]:text-left",
          "[&_.todex-table_.selectedCell]:bg-surface",
          "[&_.todex-callout]:my-3 [&_.todex-callout]:rounded-lg [&_.todex-callout]:border-l-4",
          "[&_.todex-callout]:border-primary [&_.todex-callout]:bg-surface [&_.todex-callout]:px-4 [&_.todex-callout]:py-3",
          "[&_.todex-details]:my-3 [&_.todex-details]:rounded-lg [&_.todex-details]:border",
          "[&_.todex-details]:border-border [&_.todex-details]:px-3 [&_.todex-details]:py-2",
          "[&_.tiptap_img]:my-4 [&_.tiptap_img]:h-auto [&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded-lg",
        ],
      )}
    >
      {knowledgeMode ? <DocumentTableToolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
      {knowledgeMode ? <KnowledgeBlockControls editor={editor} rootRef={rootRef} /> : null}
      <DescriptionBubbleMenu editor={editor} />
      {slashMenu && visibleSlashItems.length > 0 ? (
        <SlashCommandMenu
          activeIndex={activeSlashIndex}
          items={visibleSlashItems}
          top={slashMenu.top}
          left={slashMenu.left}
          onSelect={(item) => {
            selectSlashItem(editor, slashMenu, item);
            setSlashMenu(null);
          }}
        />
      ) : null}
      {mentionMenu ? (
        <MentionMenu
          activeIndex={activeMentionIndex}
          items={visibleMentionItems}
          top={mentionMenu.top}
          left={mentionMenu.left}
          emptyLabel={mentionEmptyLabel(mentionMenu.query)}
          onSelect={(item) => {
            applyMentionEntry(editor, mentionMenu.range, item);
            if (item.kind === "target") setMentionMenu(null);
          }}
        />
      ) : null}
    </div>
  );
}

function selectSlashItem(
  editor: Editor,
  slashMenu: SlashMenuState,
  item: SlashCommandItem,
) {
  item.command(editor, slashMenu.range);
}

function matchesSlashQuery(item: SlashCommandItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return [item.title, ...item.aliases].some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}

function getSlashMenuState(
  editor: Editor,
  root: HTMLDivElement,
  commands: SlashCommandItem[],
): SlashMenuState | null {
  const { state, view } = editor;
  const { selection } = state;
  if (!selection.empty) return null;

  const { $from } = selection;
  const textBeforeCursor = $from.parent.textBetween(
    0,
    $from.parentOffset,
    "\n",
    "\n",
  );
  const match = textBeforeCursor.match(/^\/([\w-]*)$/);
  if (!match || match[1] == null) return null;

  const query = match[1].toLowerCase();
  const coords = view.coordsAtPos(selection.from);
  const rootRect = root.getBoundingClientRect();
  const visibleItemCount = commands.filter((item) =>
    matchesSlashQuery(item, query),
  ).length;
  const estimatedMenuHeight = Math.min(
    SLASH_MENU_MAX_HEIGHT,
    Math.max(1, visibleItemCount) * SLASH_MENU_ITEM_HEIGHT + 12,
  );
  const spaceBelow = window.innerHeight - coords.bottom;
  const spaceAbove = coords.top;
  const placeAbove =
    spaceBelow < estimatedMenuHeight + SLASH_MENU_VERTICAL_OFFSET &&
    spaceAbove > spaceBelow;
  const top = placeAbove
    ? coords.top -
      rootRect.top -
      estimatedMenuHeight -
      SLASH_MENU_VERTICAL_OFFSET
    : coords.bottom - rootRect.top + SLASH_MENU_VERTICAL_OFFSET;

  return {
    query,
    top: Math.max(0, top),
    left: Math.max(0, coords.left - rootRect.left),
    range: {
      from: selection.from - match[0].length,
      to: selection.from,
    },
  };
}

function getMentionMenuState(
  editor: Editor,
  root: HTMLDivElement,
): MentionMenuState | null {
  const { state, view } = editor;
  const { selection } = state;
  if (!selection.empty) return null;

  const { $from } = selection;
  const textBeforeCursor = $from.parent.textBetween(
    0,
    $from.parentOffset,
    "\n",
    "\n",
  );
  const trigger = readMentionTrigger(textBeforeCursor);
  if (!trigger) return null;

  const coords = view.coordsAtPos(selection.from);
  const rootRect = root.getBoundingClientRect();
  const top = coords.bottom - rootRect.top + SLASH_MENU_VERTICAL_OFFSET;

  return {
    query: trigger.query,
    top: Math.max(0, top),
    left: Math.max(0, coords.left - rootRect.left),
    range: {
      from: selection.from - trigger.length,
      to: selection.from,
    },
  };
}

function DocumentTableToolbar({ editor }: { editor: Editor }) {
  const actions = [
    { label: "Add row", run: () => editor.chain().focus().addRowAfter().run() },
    { label: "Add column", run: () => editor.chain().focus().addColumnAfter().run() },
    { label: "Delete row", run: () => editor.chain().focus().deleteRow().run() },
    { label: "Delete column", run: () => editor.chain().focus().deleteColumn().run() },
    { label: "Delete table", run: () => editor.chain().focus().deleteTable().run() },
  ];
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: current }) => current.isEditable && current.isActive("table")}
      options={{ placement: "top-start", offset: 6 }}
    >
      <div
        role="toolbar"
        aria-label="Table editing"
        className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-popover p-1 shadow-lg"
        onMouseDown={(event) => event.preventDefault()}
      >
        {actions.map(({ label, run }, index) => (
          <button
            key={label}
            type="button"
            className={cn(
              "rounded px-2 py-1 text-xs text-popover-foreground hover:bg-surface",
              index === 4 && "border-l border-border pl-3 text-muted-foreground",
            )}
            onClick={run}
            aria-label={label}
          >
            {label}
          </button>
        ))}
      </div>
    </BubbleMenu>
  );
}

function DescriptionBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: menuEditor, state }) =>
        menuEditor.isEditable && !state.selection.empty
      }
      options={{ placement: "top", offset: 8 }}
    >
      <div className="flex gap-0.5 rounded-md border border-border bg-popover p-1 shadow-md">
        <BubbleButton
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </BubbleButton>
        <BubbleButton
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </BubbleButton>
        <BubbleButton
          isActive={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          S
        </BubbleButton>
        <BubbleButton
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •
        </BubbleButton>
        <BubbleButton
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </BubbleButton>
        <BubbleButton
          isActive={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          ☐
        </BubbleButton>
      </div>
    </BubbleMenu>
  );
}

function BubbleButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "h-7 min-w-7 rounded px-1.5 text-xs font-semibold text-popover-foreground",
        isActive && "bg-surface",
      )}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SlashCommandMenu({
  activeIndex,
  items,
  top,
  left,
  onSelect,
}: SlashCommandMenuProps) {
  return (
    <div
      className="absolute z-50 max-h-80 w-60 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-md"
      style={{ top, left }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {items.map((item, itemIndex) => (
        <button
          key={item.title}
          type="button"
          className={cn(
            "flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-popover-foreground hover:bg-surface",
            itemIndex === activeIndex && "bg-surface",
          )}
          onClick={() => onSelect(item)}
        >
          <span>{item.title}</span>
          {item.shortcut ? (
            <kbd className="text-xs text-muted-foreground">{item.shortcut}</kbd>
          ) : null}
        </button>
      ))}
    </div>
  );
}

interface TaskDescriptionEditorProps {
  content: string;
  document?: ProseDoc;
  onChange?: (html: string) => void;
  onDocumentChange?: (document: ProseDoc) => void;
  excludeDocId?: string;
  appearance?: "field" | "plain";
  contentClassName?: string;
  knowledgeMode?: boolean;
  knowledgeSpaceId?: string;
}

interface MentionMenuState {
  query: string;
  top: number;
  left: number;
  range: { from: number; to: number };
}

interface SlashMenuState {
  query: string;
  top: number;
  left: number;
  range: { from: number; to: number };
}

interface SlashCommandItem {
  title: string;
  shortcut?: string;
  aliases: string[];
  command: (editor: Editor, range: SlashMenuState["range"]) => void;
}

interface SlashCommandMenuProps {
  activeIndex: number;
  items: SlashCommandItem[];
  top: number;
  left: number;
  onSelect: (item: SlashCommandItem) => void;
}
