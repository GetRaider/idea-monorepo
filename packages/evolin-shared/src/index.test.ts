import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

import { isoWeekday, isScheduledWeekday } from './index';

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

describe('package dist', () => {
  it('loads the CommonJS dist from require', () => {
    const requireDist = createRequire(__filename);
    const dist = requireDist('../dist/index.js') as typeof import('./index');
    expect(dist.DEFAULT_SLOT_LIMIT).toBe(2);
    expect(dist.ESTABLISHMENT_WINDOW_DAYS).toBe(30);
    expect(dist.ESTABLISHMENT_COMPLETION_THRESHOLD).toBe(0.9);
  });
});
