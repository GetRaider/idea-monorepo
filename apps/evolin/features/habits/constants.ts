import type { HabitCategory, HabitStatus } from '@repo/evolin-shared';

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  health: 'Health',
  mind: 'Mind',
  work: 'Work',
  home: 'Home',
  relationships: 'Relationships',
  learning: 'Learning',
  other: 'Other',
};

export const STATUS_LABELS: Record<HabitStatus, string> = {
  backlog: 'Backlog',
  establishing: 'Establishing',
  paused: 'Paused',
  established: 'Established',
};

export const WEEKDAYS = [
  { value: 1, shortLabel: 'Mon', label: 'Monday' },
  { value: 2, shortLabel: 'Tue', label: 'Tuesday' },
  { value: 3, shortLabel: 'Wed', label: 'Wednesday' },
  { value: 4, shortLabel: 'Thu', label: 'Thursday' },
  { value: 5, shortLabel: 'Fri', label: 'Friday' },
  { value: 6, shortLabel: 'Sat', label: 'Saturday' },
  { value: 7, shortLabel: 'Sun', label: 'Sunday' },
] as const;
