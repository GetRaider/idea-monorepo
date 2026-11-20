import { RelationEntityType, RelationKind } from "@repo/api/todex";
import type { RelationEndpoint } from "@repo/api/todex";

const LINK_TYPES = new Set<string>([
  RelationEntityType.TASK,
  RelationEntityType.DOC,
  RelationEntityType.EPIC,
  RelationEntityType.EVENT,
]);

export function orderRelatedTo(
  left: RelationEndpoint,
  right: RelationEndpoint,
): { source: RelationEndpoint; target: RelationEndpoint } | null {
  const comparison = compareEndpoint(left, right);
  if (comparison === 0) return null;
  if (comparison < 0) return { source: left, target: right };
  return { source: right, target: left };
}

export function dependsOnWouldCycle(
  edges: DependencyEdge[],
  sourceId: string,
  targetId: string,
): boolean {
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    const next = outgoing.get(edge.sourceId) ?? [];
    next.push(edge.targetId);
    outgoing.set(edge.sourceId, next);
  }
  const seen = new Set<string>();
  const stack = [targetId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current)) continue;
    if (current === sourceId) return true;
    seen.add(current);
    for (const next of outgoing.get(current) ?? []) stack.push(next);
  }
  return false;
}

export function isLinkableType(type: string): boolean {
  return LINK_TYPES.has(type);
}

export function explicitOriginFor(kind: string): "explicit" | null {
  if (kind === RelationKind.RELATED_TO || kind === RelationKind.DEPENDS_ON) {
    return "explicit";
  }
  return null;
}

function compareEndpoint(left: RelationEndpoint, right: RelationEndpoint) {
  if (left.type !== right.type) return left.type < right.type ? -1 : 1;
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
}
