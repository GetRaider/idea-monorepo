import { describe, expect, it } from 'vitest';

import {
  PracticeDateInFutureError,
  PracticeNotAllowedError,
  PracticeNotScheduledError,
  assertPracticeInsertIsScheduled,
  isDateDuringEstablishing,
  validatePracticeDate,
} from './practice-rules';

describe('practice date rules', () => {
  const events = [
    {
      toStatus: 'establishing' as const,
      occurredAt: new Date('2026-11-01T08:00:00.000Z'),
    },
    {
      toStatus: 'paused' as const,
      occurredAt: new Date('2026-11-05T08:00:00.000Z'),
    },
  ];

  it('rejects future dates', () => {
    expect(() =>
      validatePracticeDate({
        date: '2026-11-10',
        timeZone: 'UTC',
        now: new Date('2026-11-09T12:00:00.000Z'),
        createdAt: new Date('2026-11-01T08:00:00.000Z'),
        events,
      }),
    ).toThrow(PracticeDateInFutureError);
  });

  it('allows correcting a past establishing day while paused', () => {
    expect(() =>
      validatePracticeDate({
        date: '2026-11-03',
        timeZone: 'UTC',
        now: new Date('2026-11-09T12:00:00.000Z'),
        createdAt: new Date('2026-11-01T08:00:00.000Z'),
        events,
      }),
    ).not.toThrow();
  });

  it('rejects today after the habit has been paused', () => {
    expect(() =>
      validatePracticeDate({
        date: '2026-11-09',
        timeZone: 'UTC',
        now: new Date('2026-11-09T12:00:00.000Z'),
        createdAt: new Date('2026-11-01T08:00:00.000Z'),
        events,
      }),
    ).toThrow(PracticeNotAllowedError);
  });

  it('rejects a new row whose weekday is off-schedule', () => {
    expect(() =>
      assertPracticeInsertIsScheduled('2026-11-09', 'UTC', [7]),
    ).toThrow(PracticeNotScheduledError);
  });

  it('treats an open establishing interval as inclusive through today', () => {
    expect(
      isDateDuringEstablishing('2026-11-09', 'UTC', [
        {
          toStatus: 'establishing',
          occurredAt: new Date('2026-11-01T08:00:00.000Z'),
        },
      ]),
    ).toBe(true);
  });
});
