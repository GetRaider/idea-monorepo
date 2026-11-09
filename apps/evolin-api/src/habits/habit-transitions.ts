import type { HabitStatus } from '@repo/evolin-shared';

const targetStatusByAction = {
  activate: 'establishing',
  pause: 'paused',
  resume: 'establishing',
  backlog: 'backlog',
  graduate: 'established',
} as const satisfies Record<HabitAction, HabitStatus>;

const allowedTransitions = new Set([
  'backlog:activate',
  'establishing:pause',
  'establishing:backlog',
  'establishing:graduate',
  'paused:resume',
  'paused:backlog',
]);

export function resolveHabitTransition(
  currentStatus: HabitStatus,
  action: HabitAction,
): HabitStatus {
  const targetStatus = targetStatusByAction[action];

  if (currentStatus === targetStatus) return currentStatus;
  if (allowedTransitions.has(`${currentStatus}:${action}`)) return targetStatus;

  throw new InvalidTransitionError(currentStatus, action);
}

export class InvalidTransitionError extends Error {
  constructor(
    readonly currentStatus: HabitStatus,
    readonly action: HabitAction,
  ) {
    super(`Cannot ${action} a habit that is ${currentStatus}.`);
    this.name = 'InvalidTransitionError';
  }
}

export type HabitAction =
  | 'activate'
  | 'pause'
  | 'resume'
  | 'backlog'
  | 'graduate';
