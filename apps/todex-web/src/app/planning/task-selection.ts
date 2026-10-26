export function isToggleClick(
  event: { metaKey: boolean; ctrlKey: boolean },
  platform = "",
): boolean {
  if (event.metaKey) return true;
  if (!event.ctrlKey) return false;
  return !/Mac|iPhone|iPad|iPod/.test(platform);
}

export function applyTaskSelection(
  input: TaskSelectionInput,
): TaskSelectionResult {
  if (input.toggle && !input.shift) {
    const selectedIds = new Set(input.selectedIds);
    if (selectedIds.has(input.taskId)) selectedIds.delete(input.taskId);
    else selectedIds.add(input.taskId);
    return { selectedIds, anchorId: input.taskId };
  }

  if (input.shift && input.anchorId) {
    const range = taskIdsInRange(
      input.orderedIds,
      input.anchorId,
      input.taskId,
    );
    if (!range) {
      return { selectedIds: new Set([input.taskId]), anchorId: input.taskId };
    }
    if (input.toggle) {
      const selectedIds = new Set(input.selectedIds);
      for (const taskId of range) selectedIds.add(taskId);
      return { selectedIds, anchorId: input.anchorId };
    }
    return { selectedIds: new Set(range), anchorId: input.anchorId };
  }

  return { selectedIds: new Set([input.taskId]), anchorId: input.taskId };
}

export function selectionForContextTarget(
  selectedIds: ReadonlySet<string>,
  taskId: string,
): ReadonlySet<string> {
  if (selectedIds.has(taskId)) return selectedIds;
  return new Set([taskId]);
}

export function orderedTaskIds(surface: Element | null): string[] {
  if (!surface) return [];
  const taskIds: string[] = [];
  for (const node of surface.querySelectorAll("[data-task-id]")) {
    const taskId = node.getAttribute("data-task-id");
    if (taskId) taskIds.push(taskId);
  }
  return taskIds;
}

export function collectDescendantIds(
  tasks: ReadonlyArray<{ id: string; parentTaskId: string | null }>,
  rootId: string,
): Set<string> {
  const descendantIds = new Set<string>();
  const pending = tasks
    .filter((task) => task.parentTaskId === rootId)
    .map((task) => task.id);

  while (pending.length > 0) {
    const taskId = pending.pop();
    if (!taskId || descendantIds.has(taskId)) continue;
    descendantIds.add(taskId);
    for (const task of tasks) {
      if (task.parentTaskId === taskId) pending.push(task.id);
    }
  }

  return descendantIds;
}

function taskIdsInRange(
  orderedIds: readonly string[],
  anchorId: string,
  taskId: string,
): string[] | null {
  const start = orderedIds.indexOf(anchorId);
  const end = orderedIds.indexOf(taskId);
  if (start === -1 || end === -1) return null;
  const [from, to] = start < end ? [start, end] : [end, start];
  return orderedIds.slice(from, to + 1);
}

interface TaskSelectionInput {
  selectedIds: ReadonlySet<string>;
  anchorId: string | null;
  taskId: string;
  orderedIds: readonly string[];
  shift: boolean;
  toggle: boolean;
}

interface TaskSelectionResult {
  selectedIds: ReadonlySet<string>;
  anchorId: string;
}
