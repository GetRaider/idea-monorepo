/** Nominal height for one task card “slot” (padding + one-line title + meta). */
export const KANBAN_TASK_SLOT_MIN_HEIGHT_PX = 132;

/** Gap between stacked tasks in a column (matches ColumnContent gap). */
export const KANBAN_COLUMN_TASK_GAP_PX = 12;

export function columnContentMinHeightForExtraSlot(taskCount: number): number {
  return (
    (taskCount + 1) * KANBAN_TASK_SLOT_MIN_HEIGHT_PX +
    taskCount * KANBAN_COLUMN_TASK_GAP_PX
  );
}
