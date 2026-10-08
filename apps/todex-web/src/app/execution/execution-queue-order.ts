export function moveQueueItem(
  taskIds: string[],
  activeTaskId: string,
  overTaskId: string,
) {
  const fromIndex = taskIds.indexOf(activeTaskId);
  const toIndex = taskIds.indexOf(overTaskId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return taskIds;
  const next = [...taskIds];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return taskIds;
  next.splice(toIndex, 0, moved);
  return next;
}
