"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { cn } from "@repo/ui";

export function TaskDescriptionEditor({
  content,
  onChange,
}: TaskDescriptionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Add a description…" }),
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

  if (!editor) {
    return (
      <div className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background px-3 py-2 text-sm",
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
    >
      <EditorContent editor={editor} />
      <DescriptionBubbleMenu editor={editor} />
    </div>
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

interface TaskDescriptionEditorProps {
  content: string;
  onChange: (html: string) => void;
}
