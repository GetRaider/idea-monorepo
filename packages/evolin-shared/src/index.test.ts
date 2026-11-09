import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

import {
  IncompletePlanError,
  assertCompletePlan,
  getIncompletePlanFields,
  isoWeekday,
  isPlanComplete,
  isScheduledWeekday,
} from './index';

describe('isoWeekday', () => {
  it('returns ISO weekdays without timezone drift', () => {
    expect(isoWeekday('2026-11-09', 'Europe/Warsaw')).toBe(1);
    expect(isoWeekday('2026-11-15', 'America/Los_Angeles')).toBe(7);
    expect(isoWeekday('2026-11-09', 'Pacific/Kiritimati')).toBe(1);
  });
});

describe('schedule membership', () => {
  it('matches configured weekdays', () => {
    expect(isScheduledWeekday([1, 3, 5], 3)).toBe(true);
    expect(isScheduledWeekday([1, 3, 5], 2)).toBe(false);
    expect(isScheduledWeekday(null, 1)).toBe(false);
  });
});

describe('plan completeness', () => {
  const completePlan = {
    why: 'Feel stronger',
    minimumAction: 'Do one push-up',
    trigger: 'After brushing my teeth',
    weekdays: [1, 3, 5],
    estimatedDurationMinutes: 2,
  };

  it('accepts a complete plan', () => {
    expect(isPlanComplete(completePlan)).toBe(true);
    expect(() => assertCompletePlan(completePlan)).not.toThrow();
  });

  it('loads the CommonJS dist from require', () => {
    const requireDist = createRequire(__filename);
    const dist = requireDist('../dist/index.js') as typeof import('./index');
    expect(dist.ACTIVE_HABIT_MAXIMUM).toBe(3);
    expect(dist.ACTIVE_HABIT_RECOMMENDED).toBe(2);
  });

  it('lists every missing field', () => {
    const incompletePlan = {
      ...completePlan,
      why: ' ',
      weekdays: null,
      estimatedDurationMinutes: null,
    };

    expect(getIncompletePlanFields(incompletePlan)).toEqual([
      'why',
      'weekdays',
      'estimatedDurationMinutes',
    ]);
    expect(() => assertCompletePlan(incompletePlan)).toThrow(IncompletePlanError);
  });
});
