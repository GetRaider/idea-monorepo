export function deriveHasWorkspaceTaskData({
  isAnonymous,
  guestTaskCount,
  workspaceTaskTotal,
}: DeriveHasWorkspaceTaskDataInput): boolean {
  if (isAnonymous) return guestTaskCount > 0;
  return (workspaceTaskTotal ?? 0) > 0;
}

interface DeriveHasWorkspaceTaskDataInput {
  isAnonymous: boolean;
  guestTaskCount: number;
  workspaceTaskTotal: number | null | undefined;
}
