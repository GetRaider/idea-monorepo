import { Extension } from "@tiptap/core";

/** Persist subtle block backgrounds as a document attribute, not ephemeral UI state. */
export const KnowledgeBlockAppearance = Extension.create({
  name: "knowledgeBlockAppearance",

  addGlobalAttributes() {
    return [{
      types: ["paragraph", "heading", "blockquote", "callout"],
      attributes: {
        blockTone: {
          default: null,
          parseHTML: (element: HTMLElement) => element.getAttribute("data-block-tone"),
          renderHTML: (attributes: Record<string, unknown>) => {
            const tone = attributes.blockTone;
            return tone === "gray" || tone === "brown" || tone === "blue"
              ? { "data-block-tone": tone }
              : {};
          },
        },
      },
    }];
  },
});
