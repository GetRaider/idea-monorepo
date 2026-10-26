import { TaskStatus } from "@repo/api/todex";
import type { PlanningProgress } from "@repo/api/todex";

export function planningProgress(
  statuses: readonly string[],
): PlanningProgress {
  const totalTasks = statuses.length;
  const completedTasks = statuses.filter(
    (status) => status === TaskStatus.DONE,
  ).length;
  const progressPercent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  return { totalTasks, completedTasks, progressPercent };
}
