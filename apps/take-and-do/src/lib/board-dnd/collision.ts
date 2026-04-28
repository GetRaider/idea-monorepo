import type { CollisionDetection } from "@dnd-kit/core";
import { pointerWithin, rectIntersection } from "@dnd-kit/core";

import type { ListDroppableData } from "./list";

/**
 * Between-row reorder zones overlap row edges (negative margin). When the cursor
 * sits in the overlap, both a reorder and a subtask droppable contain the
 * pointer — prefer reorder so "drop before/after" wins; subtask drops win only
 * when no reorder zone is under the pointer.
 */
export const listBoardCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length === 0) {
    return rectIntersection(args);
  }
  const reorderHits = pointerHits.filter((c) => {
    const data = args.droppableContainers.find((d) => d.id === c.id)?.data
      .current as ListDroppableData | undefined;
    return data?.type === "reorder";
  });
  return reorderHits.length > 0 ? reorderHits : pointerHits;
};
