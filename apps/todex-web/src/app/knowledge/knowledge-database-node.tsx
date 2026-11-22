"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

import { KnowledgeDatabaseTable } from "./knowledge-database-table";

export const KnowledgeDatabaseNode = Node.create({
  name: "databaseView",
  group: "block",
  atom: true,
  isolating: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      databaseId: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-knowledge-database-id"),
      },
      viewId: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-knowledge-view-id"),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-knowledge-database-id]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return ["div", mergeAttributes(HTMLAttributes, {
      "data-knowledge-database-id": node.attrs.databaseId,
      "data-knowledge-view-id": node.attrs.viewId,
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(KnowledgeDatabaseView);
  },
});

function KnowledgeDatabaseView({ node }: NodeViewProps) {
  const databaseId = String(node.attrs.databaseId ?? "");
  return (
    <NodeViewWrapper as="div" className="my-6" contentEditable={false}>
      {databaseId ? <KnowledgeDatabaseTable databaseId={databaseId} /> :
        <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
          Missing database reference
        </div>}
    </NodeViewWrapper>
  );
}
