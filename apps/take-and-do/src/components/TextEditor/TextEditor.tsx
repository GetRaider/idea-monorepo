"use client";

import {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import type { Editor } from "@tiptap/react";

type SlashMenuState = {
  query: string;
  top: number;
  left: number;
  placement: "top" | "bottom";
  range: {
    from: number;
    to: number;
  };
};

type SlashCommandItem = {
  title: string;
  shortcut?: string;
  aliases: string[];
  command: (editor: Editor, range: SlashMenuState["range"]) => void;
};

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

const SLASH_MENU_MAX_HEIGHT = 320;
const SLASH_MENU_ITEM_HEIGHT = 38;
const SLASH_MENU_VERTICAL_OFFSET = 8;

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

  if (!match) return null;

  const coords = view.coordsAtPos(selection.from);
  const rootRect = root.getBoundingClientRect();
  const visibleItemCount = SLASH_COMMANDS.filter((item) =>
    [item.title, ...item.aliases].some((value) =>
      value.toLowerCase().includes(match[1].toLowerCase()),
    ),
  ).length;
  const estimatedMenuHeight = Math.min(
    SLASH_MENU_MAX_HEIGHT,
    Math.max(1, visibleItemCount) * SLASH_MENU_ITEM_HEIGHT + 12,
  );
  const spaceBelow = window.innerHeight - coords.bottom;
  const spaceAbove = coords.top;
  const placement =
    spaceBelow < estimatedMenuHeight + SLASH_MENU_VERTICAL_OFFSET &&
    spaceAbove > spaceBelow
      ? "top"
      : "bottom";
  const top =
    placement === "top"
      ? coords.top -
        rootRect.top -
        estimatedMenuHeight -
        SLASH_MENU_VERTICAL_OFFSET
      : coords.bottom - rootRect.top + SLASH_MENU_VERTICAL_OFFSET;

  return {
    query: match[1].toLowerCase(),
    top: Math.max(0, top),
    left: Math.max(0, coords.left - rootRect.left),
    placement,
    range: {
      from: selection.from - match[0].length,
      to: selection.from,
    },
  };
}

export function TextEditor({
  className,
  onUpdate,
  onBlur,
  content = "",
  editable = false,
  placeholder = "No description",
}: TextEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [activeSlashIndex, setActiveSlashIndex] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onUpdate) {
        onUpdate(html);
      }
    },
    editorProps: {
      attributes: {
        class: "prose-editor",
      },
    },
    immediatelyRender: false,
  });

  const visibleSlashItems = useMemo(() => {
    if (!slashMenu) return [];
    const query = slashMenu.query.trim();

    if (!query) return SLASH_COMMANDS;

    return SLASH_COMMANDS.filter((item) =>
      [item.title, ...item.aliases].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [slashMenu]);

  useEffect(() => {
    if (editor && !editable) {
      const currentContent = editor.getHTML();
      if (content !== currentContent) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor, editable]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  useEffect(() => {
    if (!editor) return;

    const closeSlashMenu = () => setSlashMenu(null);
    const updateSlashMenu = () => {
      if (!editable || !rootRef.current) {
        setSlashMenu(null);
        return;
      }

      setSlashMenu(getSlashMenuState(editor, rootRef.current));
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
  }, [editor, editable]);

  useEffect(() => {
    setActiveSlashIndex(0);
  }, [slashMenu?.query]);

  useEffect(() => {
    if (activeSlashIndex >= visibleSlashItems.length) {
      setActiveSlashIndex(Math.max(visibleSlashItems.length - 1, 0));
    }
  }, [activeSlashIndex, visibleSlashItems.length]);

  const handleBlur = useCallback(() => {
    onBlur && onBlur();
  }, [onBlur]);

  useEffect(() => {
    if (!editable || !editor) return;

    const handleClickOutsideToSave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && !target.closest(".task-editor-root")) {
        handleBlur();
      }
    };

    const timeoutId = setTimeout(
      () => document.addEventListener("mousedown", handleClickOutsideToSave),
      100,
    );

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutsideToSave);
    };
  }, [editable, editor, handleBlur]);

  if (!editor) {
    return (
      <TaskEditorRoot>
        <div>Loading editor...</div>
      </TaskEditorRoot>
    );
  }

  const selectSlashItem = (item: SlashCommandItem) => {
    if (!slashMenu) return;

    item.command(editor, slashMenu.range);
    setSlashMenu(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!slashMenu || visibleSlashItems.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSlashIndex((index) => (index + 1) % visibleSlashItems.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSlashIndex(
        (index) =>
          (index - 1 + visibleSlashItems.length) % visibleSlashItems.length,
      );
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const selectedItem = visibleSlashItems[activeSlashIndex];
      if (selectedItem) selectSlashItem(selectedItem);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setSlashMenu(null);
    }
  };

  return (
    <TaskEditorRoot
      ref={rootRef}
      className={className}
      onKeyDown={handleKeyDown}
    >
      <div className="task-editor-surface">
        <EditorContent editor={editor} />
      </div>
      <EditorBubbleMenu editor={editor} />
      {slashMenu && visibleSlashItems.length > 0 && (
        <SlashCommandMenu
          activeIndex={activeSlashIndex}
          items={visibleSlashItems}
          onSelect={selectSlashItem}
          placement={slashMenu.placement}
          top={slashMenu.top}
          left={slashMenu.left}
        />
      )}
    </TaskEditorRoot>
  );
}

function TaskEditorRoot({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div className={`task-editor-root ${className ?? ""}`} {...props}>
      {children}
    </div>
  );
}

function EditorBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu
      editor={editor}
      className="editor-bubble-menu"
      shouldShow={({ editor, state }) =>
        editor.isEditable && !state.selection.empty
      }
      options={{ placement: "top", offset: 8 }}
    >
      <EditorMenuButton
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </EditorMenuButton>
      <EditorMenuButton
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </EditorMenuButton>
      <EditorMenuButton
        isActive={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        S
      </EditorMenuButton>
      <EditorMenuButton
        isActive={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        U
      </EditorMenuButton>
    </BubbleMenu>
  );
}

type EditorMenuButtonProps = ComponentProps<"button"> & {
  isActive?: boolean;
};

function EditorMenuButton({
  className,
  isActive,
  type = "button",
  ...props
}: EditorMenuButtonProps) {
  return (
    <button
      className={`editor-menu-button ${isActive ? "is-active" : ""} ${className ?? ""}`}
      onMouseDown={(event) => event.preventDefault()}
      type={type}
      {...props}
    />
  );
}

type SlashCommandMenuProps = {
  activeIndex: number;
  items: SlashCommandItem[];
  left: number;
  placement: SlashMenuState["placement"];
  top: number;
  onSelect: (item: SlashCommandItem) => void;
};

function SlashCommandMenu({
  activeIndex,
  items,
  left,
  placement,
  top,
  onSelect,
}: SlashCommandMenuProps) {
  return (
    <div
      className={`editor-slash-menu is-${placement}`}
      style={{ left, top }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {items.map((item, index) => (
        <button
          key={item.title}
          className={`editor-slash-menu-item ${
            index === activeIndex ? "is-active" : ""
          }`}
          onClick={() => onSelect(item)}
          type="button"
        >
          <span>{item.title}</span>
          {item.shortcut && <kbd>{item.shortcut}</kbd>}
        </button>
      ))}
    </div>
  );
}

interface TextEditorProps {
  className?: string;
  content: string;
  editable: boolean;
  placeholder?: string;
  onUpdate?: (html: string) => void;
  onBlur?: () => void;
}
