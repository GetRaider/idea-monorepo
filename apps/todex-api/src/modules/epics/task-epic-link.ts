export function resolveTaskEpicLink(input: TaskEpicLinkInput): string | null {
  if (input.requestedEpicId !== undefined) return input.requestedEpicId;
  if (input.spaceChanged) return null;
  return input.currentEpicId;
}

interface TaskEpicLinkInput {
  spaceChanged: boolean;
  currentEpicId: string | null;
  requestedEpicId: string | null | undefined;
}
