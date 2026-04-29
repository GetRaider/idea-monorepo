/** Nominal height for one task card “slot” (padding + one-line title + meta). */
export const KANBAN_TASK_SLOT_MIN_HEIGHT_PX = 132;

/** Approx. vertical space between stacked task cards (drop zone margins + strip). */
export const KANBAN_COLUMN_TASK_GAP_PX = 18;

export function columnContentMinHeightForExtraSlot(taskCount: number): number {
  return (
    (taskCount + 1) * KANBAN_TASK_SLOT_MIN_HEIGHT_PX +
    taskCount * KANBAN_COLUMN_TASK_GAP_PX
  );
}
