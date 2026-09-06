export function hasParentCycle(
  taskId: string,
  newParentId: string | null,
  parentById: Map<string, string | null>,
): boolean {
  if (!newParentId) return false;
  if (newParentId === taskId) return true;

  const visited = new Set<string>();
  let current: string | null = newParentId;

  while (current) {
    if (current === taskId) return true;
    if (visited.has(current)) return true;
    visited.add(current);
    current = parentById.get(current) ?? null;
  }

  return false;
}

export function formatTaskKey(sequence: number): string {
  return `T-${sequence}`;
}
