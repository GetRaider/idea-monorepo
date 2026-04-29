import type { Collision, CollisionDetection } from "@dnd-kit/core";
import { pointerWithin, rectIntersection } from "@dnd-kit/core";

import type { ListDroppableData, ReorderDroppableData } from "./list";

function getReorderData(
  args: Parameters<CollisionDetection>[0],
  hit: Collision,
): ReorderDroppableData | undefined {
  return args.droppableContainers.find((d) => d.id === hit.id)?.data.current as
    | ReorderDroppableData
    | undefined;
}

/** Squared distance from point to axis-aligned rect (0 if the point is inside). */
function distSqPointToRect(
  pointer: { x: number; y: number },
  rect: { top: number; left: number; bottom: number; right: number },
): number {
  const nx = Math.max(rect.left, Math.min(pointer.x, rect.right));
  const ny = Math.max(rect.top, Math.min(pointer.y, rect.bottom));
  const dx = pointer.x - nx;
  const dy = pointer.y - ny;
  return dx * dx + dy * dy;
}

/**
 * When several reorder droppables overlap (negative margins, tail fill zones,
 * adjacent sections), resolve the intended target.
 *
 * 1. **Collapsed section headers** beat overlapping tail zones below — list
 *    tail regions must not use `flex-1`, but we still prefer this flag when both
 *    register under `pointerWithin`.
 * 2. Otherwise pick the smallest **distance from pointer to rect** (edge distance
 *    is 0 inside the rect), not distance to center — avoids bias toward large rects.
 */
function narrowReorderCollisionsByPointer(
  args: Parameters<CollisionDetection>[0],
  reorderHits: Collision[],
): Collision[] {
  const pointer = args.pointerCoordinates;
  if (reorderHits.length <= 1) {
    return reorderHits;
  }
  if (!pointer) {
    return reorderHits;
  }

  const scored = reorderHits
    .map((hit) => {
      const rect = args.droppableRects.get(hit.id);
      const data = getReorderData(args, hit);
      if (!rect) return null;
      const collapsedPriority = data?.collapsedSectionHeader ? 0 : 1;
      const dist = distSqPointToRect(pointer, rect);
      return { hit, collapsedPriority, dist };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  scored.sort((a, b) => {
    if (a.collapsedPriority !== b.collapsedPriority) {
      return a.collapsedPriority - b.collapsedPriority;
    }
    return a.dist - b.dist;
  });

  return scored[0] ? [scored[0].hit] : reorderHits;
}

/**
 * Between-row reorder zones overlap row edges (negative margin). When the cursor
 * sits in the overlap, both a reorder and a subtask droppable contain the
 * pointer — prefer reorder so "drop before/after" wins; subtask drops win only
 * when no reorder zone is under the pointer.
 *
 * When several reorder zones overlap, `pointerWithin` returns all of them and
 * @dnd-kit can resolve `over` unpredictably — narrow by pointer proximity.
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
  if (reorderHits.length === 0) {
    return pointerHits;
  }

  return narrowReorderCollisionsByPointer(args, reorderHits);
};
