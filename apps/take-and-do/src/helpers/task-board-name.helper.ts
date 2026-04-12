import {
  isDuplicateWorkspaceName,
  normalizeWorkspaceNameForComparison,
} from "./workspace-name.helper";

export const normalizeTaskBoardNameForComparison =
  normalizeWorkspaceNameForComparison;

export function isDuplicateTaskBoardName(
  name: string,
  boards: ReadonlyArray<{ id: string; name: string }>,
  excludeBoardId?: string,
): boolean {
  return isDuplicateWorkspaceName(name, boards, [], {
    boardId: excludeBoardId,
  });
}

export { isDuplicateWorkspaceName } from "./workspace-name.helper";
