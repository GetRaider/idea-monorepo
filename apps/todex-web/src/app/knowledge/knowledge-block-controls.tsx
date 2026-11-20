"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { Editor } from "@tiptap/react";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui";

type Block = {
  pos: number;
  size: number;
  type: string;
  rect: DOMRect;
};
type DropDirection = "before" | "after" | "left" | "right";
type DropTarget = { block: Block; direction: DropDirection };
const ACCEPTED_CONTAINERS = new Set([
  "doc", "column", "detailsContent", "blockquote",
]);
const DRAG_MIME = "application/x-todex-knowledge-block";

/** Find the smallest independently movable block at a point inside Tiptap. */
function blockAtPoint(editor: Editor, x: number, y: number): Block | null {
  const hit = editor.view.posAtCoords({ left: x, top: y });
  if (!hit) return null;
  const $hit = editor.state.doc.resolve(hit.pos);
  if ($hit.depth === 0) {
    const boundary = hit.inside >= 0 ? hit.inside : hit.pos;
    const node = editor.state.doc.nodeAt(boundary);
    const dom = editor.view.nodeDOM(boundary);
    if (node && dom instanceof HTMLElement) {
      return {
        pos: boundary,
        size: node.nodeSize,
        type: node.type.name,
        rect: dom.getBoundingClientRect(),
      };
    }
  }
  for (let depth = $hit.depth; depth > 0; depth--) {
    const parent = $hit.node(depth - 1);
    if (!ACCEPTED_CONTAINERS.has(parent.type.name)) continue;
    const pos = $hit.before(depth);
    const node = $hit.node(depth);
    const dom = editor.view.nodeDOM(pos);
    if (!(dom instanceof HTMLElement)) continue;
    const rect = dom.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    return { pos, size: node.nodeSize, type: node.type.name, rect };
  }
  return null;
}

function dropTarget(block: Block, x: number, y: number): DropTarget {
  const fraction = (x - block.rect.left) / Math.max(1, block.rect.width);
  // A horizontal edge drop wraps the blocks into editable side-by-side columns.
  if (fraction < 0.16 && block.type !== "columns" && block.type !== "databaseView") {
    return { block, direction: "left" };
  }
  if (fraction > 0.84 && block.type !== "columns" && block.type !== "databaseView") {
    return { block, direction: "right" };
  }
  return {
    block,
    direction: y < block.rect.top + block.rect.height / 2 ? "before" : "after",
  };
}

/** Uses a single ProseMirror transaction so undo restores the original layout. */
export function relocateKnowledgeBlock(
  editor: Editor, from: number, target: number, direction: DropDirection,
): boolean {
  const { state, view } = editor;
  const node = state.doc.nodeAt(from);
  const destination = state.doc.nodeAt(target);
  if (!node || !destination || from === target) return false;
  if (target > from && target < from + node.nodeSize) return false;
  try {
    const tr = state.tr.delete(from, from + node.nodeSize);
    const mappedTarget = tr.mapping.map(target, 1);
    const currentTarget = tr.doc.nodeAt(mappedTarget);
    if (!currentTarget) return false;

    if ((direction === "left" || direction === "right") &&
      state.schema.nodes.columns && state.schema.nodes.column &&
      currentTarget.type.name !== "databaseView" &&
      currentTarget.type.name !== "columns" &&
      node.type.name !== "columns") {
      const left = direction === "left" ? node : currentTarget;
      const right = direction === "left" ? currentTarget : node;
      const columnType = state.schema.nodes.column;
      const columns = state.schema.nodes.columns.create(null, [
        columnType.create(null, left),
        columnType.create(null, right),
      ]);
      tr.replaceWith(mappedTarget, mappedTarget + currentTarget.nodeSize, columns);
    } else {
      const insertAt = direction === "before" || direction === "left"
        ? mappedTarget : mappedTarget + currentTarget.nodeSize;
      tr.insert(insertAt, node);
    }
    view.dispatch(tr.scrollIntoView());
    editor.commands.focus();
    return true;
  } catch {
    return false;
  }
}

function makeTwoColumns(editor: Editor, pos: number) {
  const { state, view } = editor;
  const node = state.doc.nodeAt(pos);
  const columns = state.schema.nodes.columns;
  const column = state.schema.nodes.column;
  const paragraph = state.schema.nodes.paragraph;
  if (!node || !columns || !column || !paragraph) return;
  try {
    view.dispatch(state.tr.replaceWith(pos, pos + node.nodeSize,
      columns.create(null, [
        column.create(null, node),
        column.create(null, paragraph.create()),
      ])).scrollIntoView());
    editor.commands.focus();
  } catch {
    // This block can't be placed in a column layout.
  }
}

function duplicateBlock(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;
  editor.chain().focus().insertContentAt(pos + node.nodeSize, node.toJSON()).run();
}

function removeBlock(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;
  editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
}

export function KnowledgeBlockControls({
  editor,
  rootRef,
}: {
  editor: Editor;
  rootRef: RefObject<HTMLDivElement | null>;
}) {
  const [hover, setHover] = useState<Block | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [preview, setPreview] = useState<DropTarget | null>(null);
  const sourceRef = useRef<number | null>(null);
  const hoverRef = useRef<Block | null>(null);
  hoverRef.current = hover;

  const updateHovered = useCallback((event: MouseEvent) => {
    if (menuOpen || sourceRef.current !== null) return;
    if ((event.target as HTMLElement).closest?.("[data-knowledge-block-controls]")) return;
    const hovered = blockAtPoint(editor, event.clientX, event.clientY);
    setHover((old) => old?.pos === hovered?.pos &&
      old?.rect.top === hovered?.rect.top && old?.rect.left === hovered?.rect.left
      ? old : hovered);
  }, [editor, menuOpen]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.addEventListener("mousemove", updateHovered);
    const clear = () => { if (!menuOpen && sourceRef.current === null) setHover(null); };
    root.addEventListener("mouseleave", clear);

    const over = (event: DragEvent) => {
      if (sourceRef.current === null || !event.dataTransfer?.types.includes(DRAG_MIME)) return;
      const target = blockAtPoint(editor, event.clientX, event.clientY);
      if (!target || target.pos === sourceRef.current) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setPreview(dropTarget(target, event.clientX, event.clientY));
    };
    const dropped = (event: DragEvent) => {
      if (sourceRef.current === null || !event.dataTransfer?.types.includes(DRAG_MIME)) return;
      event.preventDefault();
      event.stopPropagation();
      const target = blockAtPoint(editor, event.clientX, event.clientY);
      if (target) {
        const placement = dropTarget(target, event.clientX, event.clientY);
        relocateKnowledgeBlock(editor, sourceRef.current, target.pos, placement.direction);
      }
      sourceRef.current = null;
      setPreview(null);
    };
    root.addEventListener("dragover", over, true);
    root.addEventListener("drop", dropped, true);
    return () => {
      root.removeEventListener("mousemove", updateHovered);
      root.removeEventListener("mouseleave", clear);
      root.removeEventListener("dragover", over, true);
      root.removeEventListener("drop", dropped, true);
    };
  }, [editor, rootRef, updateHovered, menuOpen]);

  if (!hover) return null;
  const root = rootRef.current;
  if (!root) return null;
  const rootBounds = root.getBoundingClientRect();
  const top = hover.rect.top - rootBounds.top + root.scrollTop;
  const left = Math.max(0, hover.rect.left - rootBounds.left - 52);
  const nonText = !["paragraph", "heading", "blockquote"].includes(hover.type);

  function menuAction(action: "duplicate" | "delete" | "columns" | "up" | "down" |
      "paragraph" | "heading2" | "heading3" | "quote" |
      "gray" | "brown" | "blue" | "clearTone") {
    const current = hoverRef.current;
    setMenuOpen(false);
    if (!current) return;
    const { pos } = current;
    if (action === "duplicate") duplicateBlock(editor, pos);
    else if (action === "delete") removeBlock(editor, pos);
    else if (action === "columns") makeTwoColumns(editor, pos);
    else if (action === "up" || action === "down") {
      const $node = editor.state.doc.resolve(pos);
      const index = $node.index($node.depth);
      const parent = $node.parent;
      const adjacent = action === "up" ? index - 1 : index + 1;
      if (adjacent >= 0 && adjacent < parent.childCount) {
        const neighbor = $node.start($node.depth) +
          Array.from({ length: adjacent }, (_, i) => parent.child(i).nodeSize)
            .reduce((a, b) => a + b, 0);
        relocateKnowledgeBlock(editor, pos, neighbor,
          action === "up" ? "before" : "after");
      }
    } else if (["gray", "brown", "blue", "clearTone"].includes(action)) {
      const node = editor.state.doc.nodeAt(pos);
      if (node && ["paragraph", "heading", "blockquote", "callout"].includes(node.type.name)) {
        editor.chain().focus().setTextSelection(pos + 1).updateAttributes(
          node.type.name,
          { blockTone: action === "clearTone" ? null : action },
        ).run();
      }
    } else if (!nonText) {
      const chain = editor.chain().focus().setTextSelection(pos + 1);
      if (action === "paragraph") chain.setParagraph().run();
      if (action === "heading2") chain.setHeading({ level: 2 }).run();
      if (action === "heading3") chain.setHeading({ level: 3 }).run();
      if (action === "quote") chain.toggleBlockquote().run();
    }
  }

  return (
    <>
      <div data-knowledge-block-controls
        className="absolute z-20 flex h-8 items-center gap-0.5 rounded-md bg-background/95 text-muted-foreground shadow-sm"
        style={{ top, left }}>
        <button type="button" title="Insert block below" aria-label="Insert block below"
          className="rounded p-1 hover:bg-surface hover:text-foreground"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const current = hoverRef.current;
            if (!current) return;
            editor.chain().focus().insertContentAt(current.pos + current.size,
              { type: "paragraph" }).run();
          }}>
          +
        </button>
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button type="button" draggable title="Drag block or open block menu"
              aria-label="Drag block or open block menu"
              className="cursor-grab rounded p-1 hover:bg-surface hover:text-foreground active:cursor-grabbing"
              onDragStart={(event) => {
                const current = hoverRef.current;
                if (!current) return;
                sourceRef.current = current.pos;
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData(DRAG_MIME, String(current.pos));
                event.dataTransfer.setData("text/plain", "Move Todex block");
                setMenuOpen(false);
              }}
              onDragEnd={() => {
                sourceRef.current = null;
                setPreview(null);
              }}>
              ⋮⋮
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-1" align="start">
            {([
              ["duplicate", "Duplicate"],
              ["up", "Move up"],
              ["down", "Move down"],
              ["columns", "Make two columns"],
              ["paragraph", "Turn into text"],
              ["heading2", "Turn into heading"],
              ["heading3", "Turn into subheading"],
              ["quote", "Turn into quote"],
              ["gray", "Gray background"],
              ["brown", "Brown background"],
              ["blue", "Blue background"],
              ["clearTone", "Remove background"],
              ["delete", "Delete block"],
            ] as const).map(([action, label]) => (
              <button key={action} type="button"
                disabled={nonText && ["paragraph","heading2","heading3","quote"].includes(action)}
                className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-surface disabled:opacity-40"
                onClick={() => menuAction(action)}>
                {label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
      {preview && sourceRef.current !== null ? (
        <div className="pointer-events-none absolute z-10 bg-[#929292] opacity-80"
          style={{
            top: preview.block.rect.top - rootBounds.top +
              (preview.direction === "after" ? preview.block.rect.height : 0) + root.scrollTop,
            left: preview.block.rect.left - rootBounds.left +
              (preview.direction === "right" ? preview.block.rect.width : 0),
            width: preview.direction === "before" || preview.direction === "after"
              ? preview.block.rect.width : 3,
            height: preview.direction === "before" || preview.direction === "after"
              ? 3 : preview.block.rect.height,
          }}
        />
      ) : null}
    </>
  );
}
