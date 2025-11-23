"use client";

import { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import type { Editor } from "@tiptap/react";
import { EditorWrapper } from "./TextEditor.styles";

// Simple toolbar component for Tiptap
function EditorToolbar({ editor }: { editor: Editor }) {
  if (!editor) {
    return null;
  }

  return (
    <div className="editor-toolbar">
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
        type="button"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
        type="button"
      >
        H3
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        className={editor.isActive("heading", { level: 4 }) ? "is-active" : ""}
        type="button"
      >
        H4
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "is-active" : ""}
        type="button"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "is-active" : ""}
        type="button"
      >
        <em>I</em>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "is-active" : ""}
        type="button"
      >
        •
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "is-active" : ""}
        type="button"
      >
        1.
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={editor.isActive("taskList") ? "is-active" : ""}
        type="button"
      >
        ☑
      </button>
    </div>
  );
}

interface TextEditorProps {
  content: string;
  editable: boolean;
  placeholder?: string;
  onUpdate?: (html: string) => void;
  onBlur?: () => void;
}

export default function TextEditor({
  content,
  editable,
  placeholder = "No description provided.",
  onUpdate,
  onBlur,
}: TextEditorProps) {
  // Tiptap editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: content || "",
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

  // Update editor content when content changes externally (but not when editing)
  useEffect(() => {
    if (editor && !editable) {
      const currentContent = editor.getHTML();
      if (content !== currentContent) {
        editor.commands.setContent(content || "");
      }
    }
  }, [content, editor, editable]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur();
    }
  }, [onBlur]);

  // Handle click outside to trigger blur
  useEffect(() => {
    if (!editable || !editor) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target &&
        !target.closest(".ProseMirror") &&
        !target.closest(".editor-toolbar")
      ) {
        handleBlur();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editable, editor, handleBlur]);

  if (!editor) {
    return (
      <EditorWrapper>
        <div>Loading editor...</div>
      </EditorWrapper>
    );
  }

  return (
    <EditorWrapper>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </EditorWrapper>
  );
}
