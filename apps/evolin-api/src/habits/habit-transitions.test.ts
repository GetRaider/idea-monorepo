import { describe, expect, it } from 'vitest';

import {
  InvalidTransitionError,
  resolveHabitTransition,
  type HabitAction,
} from './habit-transitions';

describe('resolveHabitTransition', () => {
  it.each([
    ['backlog', 'activate', 'establishing'],
    ['establishing', 'pause', 'paused'],
    ['establishing', 'backlog', 'backlog'],
    ['establishing', 'graduate', 'established'],
    ['paused', 'resume', 'establishing'],
    ['paused', 'backlog', 'backlog'],
  ] as const)('%s + %s → %s', (status, action, expected) => {
    expect(resolveHabitTransition(status, action)).toBe(expected);
  });

  it.each([
    ['establishing', 'activate'],
    ['paused', 'pause'],
    ['established', 'graduate'],
  ] as const)('is idempotent when %s already matches %s', (status, action) => {
    expect(resolveHabitTransition(status, action)).toBe(status);
  });

  it('rejects illegal transitions', () => {
    expect(() =>
      resolveHabitTransition('paused', 'graduate' as HabitAction),
    ).toThrow(InvalidTransitionError);
    expect(() => resolveHabitTransition('established', 'activate')).toThrow(
      InvalidTransitionError,
    );
  });
});
