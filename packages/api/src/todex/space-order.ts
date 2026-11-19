export const SPACE_POSITION_GAP = 1024;

export function positionAfterHighest(highest: number | null) {
  if (highest == null || !Number.isFinite(highest)) return 0;
  return highest + SPACE_POSITION_GAP;
}

export function positionForDrop(
  orderedIds: readonly string[],
  positionOf: (id: string) => number | null,
  activeId: string,
  beforeId: string | null,
) {
  if (beforeId === activeId) return null;
  const withoutActive = orderedIds.filter((id) => id !== activeId);
  const insertAt =
    beforeId == null ? withoutActive.length : withoutActive.indexOf(beforeId);
  if (insertAt < 0) return null;
  if (orderedIds.indexOf(activeId) === insertAt) return null;

  const previousId = insertAt === 0 ? null : withoutActive[insertAt - 1];
  const nextId =
    insertAt >= withoutActive.length ? null : withoutActive[insertAt];
  const before = previousId == null ? null : positionOf(previousId);
  const after = nextId == null ? null : positionOf(nextId);
  if (previousId != null && before == null) return null;
  if (nextId != null && after == null) return null;
  if (before == null && after == null) return 0;
  if (before == null && after != null) return after - SPACE_POSITION_GAP;
  if (before != null && after == null) return before + SPACE_POSITION_GAP;
  if (before == null || after == null) return null;
  return (before + after) / 2;
}
