import { Node, mergeAttributes } from "@tiptap/core";

/** A layout container with independent editable ProseMirror columns. */
export const KnowledgeColumns = Node.create({
  name: "columns",
  group: "block",
  content: "column{2,3}",
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="knowledge-columns"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, {
      "data-type": "knowledge-columns",
      class: "knowledge-columns",
    }), 0];
  },
});

export const KnowledgeColumn = Node.create({
  name: "column",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="knowledge-column"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, {
      "data-type": "knowledge-column",
      class: "knowledge-column",
    }), 0];
  },
});

export function emptyKnowledgeColumns() {
  return {
    type: "columns",
    content: [
      { type: "column", content: [{ type: "paragraph" }] },
      { type: "column", content: [{ type: "paragraph" }] },
    ],
  };
}
