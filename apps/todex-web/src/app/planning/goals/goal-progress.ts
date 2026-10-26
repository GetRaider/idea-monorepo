import { TaskStatus } from "@repo/api/todex";

export function goalProgress(statuses: readonly string[]) {
  const totalTasks = statuses.length;
  const completedTasks = statuses.filter(
    (status) => status === TaskStatus.DONE,
  ).length;
  const progressPercent =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  return { totalTasks, completedTasks, progressPercent };
}

export function goalProgressLabel(progress: {
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
}) {
  return `${progress.completedTasks}/${progress.totalTasks} · ${progress.progressPercent}%`;
}
