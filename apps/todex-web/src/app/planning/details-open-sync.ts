import { Extension } from "@tiptap/core";
import { Details as BaseDetails } from "@tiptap/extension-details";

/**
 * Tiptap's details node view *toggles* the open class in a setTimeout when the node
 * starts open. If an update() lands first (for example the cursor moving into a new
 * toggle), it sets the class, and the timeout then flips it off: the toggle is
 * stored as open but rendered collapsed, and Enter in its summary jumps past it.
 * Re-sync the rendered state with the node's `open` attribute after that timeout.
 * Also persists collapse/expand for a toggle that is the first block of the doc.
 */
export const Details = BaseDetails.extend({
  addNodeView() {
    const createView = this.parent?.();
    if (!createView) return null;
    return (props) => {
      const view = createView(props);
      setTimeout(() => {
        if (typeof props.getPos !== "function") return;
        const pos = props.getPos();
        if (pos == null) return;
        const node = props.editor.state.doc.nodeAt(pos);
        if (node?.type.name !== this.name) return;
        (view.update as ((next: typeof node) => boolean) | undefined)?.call(view, node);
      });
      // Tiptap skips persisting a click on the first block of the doc (`if (!pos)`
      // treats position 0 as missing). Its listener runs first, so read the class
      // it just toggled and store it.
      const dom = view.dom as HTMLElement;
      dom.querySelector(":scope > button")?.addEventListener("click", () => {
        if (typeof props.getPos !== "function" || props.getPos() !== 0) return;
        if (!props.editor.isEditable) return;
        const open = dom.classList.contains("is-open");
        props.editor.commands.command(({ tr }) => {
          const current = tr.doc.nodeAt(0);
          if (current?.type.name !== this.name || current.attrs.open === open) return false;
          tr.setNodeMarkup(0, undefined, { ...current.attrs, open });
          return true;
        });
      });
      return view;
    };
  },
});

/**
 * Enter in an open toggle's title moves into its body. Tiptap inserts a new
 * paragraph above the body instead, leaving a stray empty line under the cursor so
 * a double Enter no longer exits the toggle. Only handles the empty-body case;
 * everything else falls through to Tiptap.
 */
export const ToggleSummaryEnter = Extension.create({
  name: "toggleSummaryEnter",
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { $head, empty } = editor.state.selection;
        if (!empty || $head.parent.type.name !== "detailsSummary") return false;
        const details = $head.node(-1);
        const body = details.maybeChild(1);
        if (!details.attrs.open || !body || body.childCount !== 1) return false;
        const only = body.firstChild;
        if (!only || only.type.name !== "paragraph" || only.content.size > 0) return false;
        return editor.commands.setTextSelection($head.after() + 2);
      },
    };
  },
});
