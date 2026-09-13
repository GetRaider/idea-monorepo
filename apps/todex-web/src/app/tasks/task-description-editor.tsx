"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { cn } from "@repo/ui";

import {
  filterSlashCommands,
  matchSlashQuery,
  type SlashCommandDefinition,
  type SlashCommandKind,
} from "./task-slash-commands";

const SLASH_MENU_MAX_HEIGHT = 320;
const SLASH_MENU_ITEM_HEIGHT = 38;
const SLASH_MENU_VERTICAL_OFFSET = 8;

export function TaskDescriptionEditor({
  content,
  onChange,
}: TaskDescriptionEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);
  const [activeSlashIndex, setActiveSlashIndex] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "Add a description… type / for formatting",
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "min-h-20 outline-none",
      },
    },
  });

  const visibleSlashItems = useMemo(
    () => (slashMenu ? filterSlashCommands(slashMenu.query) : []),
    [slashMenu],
  );

  useEffect(() => {
    if (!editor) return;

    const closeSlashMenu = () => setSlashMenu(null);
    const updateSlashMenu = () => {
      if (!rootRef.current) {
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
  }, [editor]);

  useEffect(() => {
    setActiveSlashIndex(0);
  }, [slashMenu?.query]);

  useEffect(() => {
    if (activeSlashIndex >= visibleSlashItems.length) {
      setActiveSlashIndex(Math.max(visibleSlashItems.length - 1, 0));
    }
  }, [activeSlashIndex, visibleSlashItems.length]);

  if (!editor) {
    return (
      <div className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  const selectSlashItem = (item: SlashCommandDefinition) => {
    if (!slashMenu) return;
    applySlashCommand(editor, item.kind, slashMenu.range);
    setSlashMenu(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!slashMenu || visibleSlashItems.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      setActiveSlashIndex(
        (index) => (index + 1) % visibleSlashItems.length,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      setActiveSlashIndex(
        (index) =>
          (index - 1 + visibleSlashItems.length) % visibleSlashItems.length,
      );
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      const selectedItem = visibleSlashItems[activeSlashIndex];
      if (selectedItem) selectSlashItem(selectedItem);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setSlashMenu(null);
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative rounded-md border border-input bg-background px-3 py-2 text-sm",
        "[&_.tiptap_p]:my-1",
        "[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5",
        "[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5",
        "[&_.tiptap_ul[data-type='taskList']]:list-none [&_.tiptap_ul[data-type='taskList']]:pl-0",
        "[&_.tiptap_ul[data-type='taskList']_li]:flex [&_.tiptap_ul[data-type='taskList']_li]:gap-2",
        "[&_.tiptap_blockquote]:border-l-2 [&_.tiptap_blockquote]:border-border [&_.tiptap_blockquote]:pl-3",
        "[&_.tiptap_pre]:rounded-md [&_.tiptap_pre]:bg-muted [&_.tiptap_pre]:p-2",
        "[&_.tiptap_h2]:text-base [&_.tiptap_h2]:font-semibold",
        "[&_.tiptap_h3]:text-sm [&_.tiptap_h3]:font-semibold",
      )}
      data-slash-menu={slashMenu && visibleSlashItems.length > 0 ? "open" : undefined}
      onKeyDown={handleKeyDown}
    >
      <EditorContent editor={editor} />
      <DescriptionBubbleMenu editor={editor} />
      {slashMenu && visibleSlashItems.length > 0 ? (
        <SlashCommandMenu
          activeIndex={activeSlashIndex}
          items={visibleSlashItems}
          left={slashMenu.left}
          top={slashMenu.top}
          onSelect={selectSlashItem}
        />
      ) : null}
    </div>
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
  const query = matchSlashQuery(textBeforeCursor);
  if (query === null) return null;

  const coords = view.coordsAtPos(selection.from);
  const rootRect = root.getBoundingClientRect();
  const visibleItemCount = filterSlashCommands(query).length;
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
    query: query.toLowerCase(),
    top: Math.max(0, top),
    left: Math.max(0, coords.left - rootRect.left),
    placement,
    range: {
      from: selection.from - query.length - 1,
      to: selection.from,
    },
  };
}

function applySlashCommand(
  editor: Editor,
  kind: SlashCommandKind,
  range: SlashMenuState["range"],
) {
  const chain = editor.chain().focus().deleteRange(range);
  if (kind === "paragraph") chain.setParagraph().run();
  else if (kind === "heading2") chain.setHeading({ level: 2 }).run();
  else if (kind === "heading3") chain.setHeading({ level: 3 }).run();
  else if (kind === "heading4") chain.setHeading({ level: 4 }).run();
  else if (kind === "bulletList") chain.toggleBulletList().run();
  else if (kind === "orderedList") chain.toggleOrderedList().run();
  else if (kind === "taskList") chain.toggleTaskList().run();
  else if (kind === "blockquote") chain.toggleBlockquote().run();
  else chain.toggleCodeBlock().run();
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
  left,
  top,
  onSelect,
}: {
  activeIndex: number;
  items: SlashCommandDefinition[];
  left: number;
  top: number;
  onSelect: (item: SlashCommandDefinition) => void;
}) {
  return (
    <div
      className="absolute z-20 min-w-48 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md"
      style={{ left, top }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm text-popover-foreground",
            index === activeIndex && "bg-surface",
          )}
          onClick={() => onSelect(item)}
        >
          <span>{item.title}</span>
          {item.shortcut ? (
            <kbd className="text-[10px] text-muted-foreground">
              {item.shortcut}
            </kbd>
          ) : null}
        </button>
      ))}
    </div>
  );
}

interface TaskDescriptionEditorProps {
  content: string;
  onChange: (html: string) => void;
}

interface SlashMenuState {
  query: string;
  top: number;
  left: number;
  placement: "top" | "bottom";
  range: {
    from: number;
    to: number;
  };
}
