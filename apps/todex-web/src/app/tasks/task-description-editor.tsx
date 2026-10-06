"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { ProseDocSchema, type ProseDoc } from "@repo/api/todex";
import { cn } from "@repo/ui";

import {
  applyMentionEntry,
  mentionEmptyLabel,
  mentionMenuItems,
  readMentionTrigger,
} from "./editor-mentions";
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

export function TaskDescriptionEditor({
  content,
  document,
  onChange,
  onDocumentChange,
  excludeDocId,
  appearance = "field",
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
      Placeholder.configure({ placeholder: DESCRIPTION_PLACEHOLDER }),
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
          appearance === "plain" ? "min-h-40" : "min-h-20",
        ),
      },
      handleKeyDown: (_view, event) =>
        mentionKeyDownRef.current(event) || slashKeyDownRef.current(event),
    },
  });

  const visibleMentionItems = useMemo(
    () =>
      mentionMenu ? mentionMenuItems(mentionCandidates, mentionMenu.query) : [],
    [mentionCandidates, mentionMenu],
  );

  const visibleSlashItems = useMemo(() => {
    if (!slashMenu) return [];
    return SLASH_COMMANDS.filter((item) =>
      matchesSlashQuery(item, slashMenu.query),
    );
  }, [slashMenu]);

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
      const nextMenu = getSlashMenuState(editor, root);
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
  }, [editor]);

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
          appearance === "plain"
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
        "relative text-sm",
        appearance === "plain"
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
      )}
    >
      <EditorContent editor={editor} />
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
  const visibleItemCount = SLASH_COMMANDS.filter((item) =>
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
