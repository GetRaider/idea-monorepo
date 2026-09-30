import {
  pointerWithin,
  rectIntersection,
  type Collision,
  type CollisionDetection,
} from "@dnd-kit/core";
import type { Task } from "@repo/api/todex";

export function boardDropId(drop: BoardDropData & { taskId?: string }): string {
  if (drop.kind === "row" && drop.taskId) return `drop-row:${drop.taskId}`;
  const index = drop.index == null ? "end" : String(drop.index);
  const section = drop.combinedOpen ? "open" : drop.status;
  return `drop:${drop.kind}:${section}:${index}`;
}

export const boardCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
  if (hits.length <= 1) return hits;
  const gaps = hits.filter((hit) => dropKind(args, hit.id) === "gap");
  const pool = gaps.length > 0 ? gaps : hits;
  return [closestToPointer(args, pool)];
};

function closestToPointer(
  args: Parameters<CollisionDetection>[0],
  hits: Collision[],
): Collision {
  const pointer = args.pointerCoordinates;
  const first = hits[0];
  if (!pointer || !first || hits.length === 1) return first!;
  let closest = first;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (const hit of hits) {
    const rect = args.droppableRects.get(hit.id);
    if (!rect) continue;
    const distance = Math.abs(pointer.y - (rect.top + rect.height / 2));
    if (distance < closestDistance) {
      closest = hit;
      closestDistance = distance;
    }
  }
  return closest;
}

function dropKind(
  args: Parameters<CollisionDetection>[0],
  id: Collision["id"],
): BoardDropData["kind"] | undefined {
  const data = args.droppableContainers.find((droppable) => droppable.id === id)
    ?.data.current as BoardDropData | undefined;
  return data?.type === "reorder" ? data.kind : undefined;
}

export interface BoardDropData {
  type: "reorder";
  status: Task["status"];
  index: number | null;
  combinedOpen?: boolean;
  kind: "gap" | "fill" | "empty" | "column" | "row" | "card";
}
