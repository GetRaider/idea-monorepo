export function rejectWorkspaceArgument(args: unknown): string | null {
  if (!args || typeof args !== "object" || !("workspaceId" in args)) return null;
  return "workspaceId is not allowed";
}
