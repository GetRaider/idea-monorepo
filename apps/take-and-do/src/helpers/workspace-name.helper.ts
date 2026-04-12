export function normalizeWorkspaceNameForComparison(name: string): string {
  return name.trim().toLowerCase();
}

/** Same name cannot be used by both a board and a folder (workspace-wide). */
export function isDuplicateWorkspaceName(
  name: string,
  boards: ReadonlyArray<{ id: string; name: string }>,
  folders: ReadonlyArray<{ id: string; name: string }>,
  exclude?: { boardId?: string; folderId?: string },
): boolean {
  const normalized = normalizeWorkspaceNameForComparison(name);
  if (!normalized) return false;
  if (
    boards.some(
      (board) =>
        board.id !== exclude?.boardId &&
        normalizeWorkspaceNameForComparison(board.name) === normalized,
    )
  )
    return true;
  if (
    folders.some(
      (folder) =>
        folder.id !== exclude?.folderId &&
        normalizeWorkspaceNameForComparison(folder.name) === normalized,
    )
  )
    return true;
  return false;
}
