import {
  playCompletionChime,
  withSmoothLayout,
} from "@/lib/effects/completion";
import { TaskStatus } from "@/types/task";

/** True when the task moves into Done from a non-Done column (chime + layout). */
export function isCompletingTaskTransition(
  previousStatus: TaskStatus | null,
  nextStatus: TaskStatus,
): boolean {
  return nextStatus === TaskStatus.DONE && previousStatus !== TaskStatus.DONE;
}

/**
 * Sync UI update (e.g. optimistic state) with optional completion chime +
 * view-transition wrapper.
 */
export function runSyncWithOptionalCompletionLayout(
  isCompleting: boolean,
  mutate: () => void,
): void {
  if (isCompleting) {
    playCompletionChime();
    withSmoothLayout(mutate);
  } else {
    mutate();
  }
}

/**
 * Async board operation: when completing, chime + `withSmoothLayout` and do not
 * await the inner work (matches existing Kanban board behavior).
 */
export async function runAsyncWithOptionalCompletionLayout(
  isCompleting: boolean,
  run: () => void | Promise<void>,
): Promise<void> {
  if (isCompleting) {
    playCompletionChime();
    withSmoothLayout(() => {
      void Promise.resolve(run());
    });
  } else {
    await run();
  }
}
