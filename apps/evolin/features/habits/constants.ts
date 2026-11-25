import type { HabitStatus, SkipReason } from '@repo/evolin-shared';
import { LIFE_AREA_NAMES, LIFE_AREA_IDS } from '@repo/evolin-shared';

export const STATUS_LABELS: Record<HabitStatus, string> = {
  backlog: 'Backlog',
  establishing: 'Establishing',
  established: 'Established',
};

export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  sick: 'Sick',
  travel: 'Travel',
  day_off: 'Day off',
  too_busy: 'Too busy',
  other: 'Other',
};

export const LIFE_AREA_OPTIONS = LIFE_AREA_IDS.map((lifeAreaId) => ({
  value: lifeAreaId,
  label: LIFE_AREA_NAMES[lifeAreaId],
}));

export const WEEKDAYS = [
  { value: 1, shortLabel: 'Mon', label: 'Monday' },
  { value: 2, shortLabel: 'Tue', label: 'Tuesday' },
  { value: 3, shortLabel: 'Wed', label: 'Wednesday' },
  { value: 4, shortLabel: 'Thu', label: 'Thursday' },
  { value: 5, shortLabel: 'Fri', label: 'Friday' },
  { value: 6, shortLabel: 'Sat', label: 'Saturday' },
  { value: 7, shortLabel: 'Sun', label: 'Sunday' },
] as const;

export const CHECKPOINT_STATUS_PRESENTATION = {
  open: {
    icon: '○',
    label: 'Open',
    className: 'border-border bg-card',
    textClassName: 'text-foreground',
  },
  completed: {
    icon: '✓',
    label: 'Completed',
    className: 'border-accent bg-accent',
    textClassName: 'text-white',
  },
  failed: {
    icon: '✕',
    label: 'Failed',
    className: 'border-destructive bg-destructive',
    textClassName: 'text-white',
  },
  skipped: {
    icon: '»',
    label: 'Skipped',
    className: 'border-foreground bg-secondary',
    textClassName: 'text-foreground',
  },
} as const;

export function formatRate(rate: number | null): string {
  if (rate === null) return 'No rate yet';
  return `${Math.round(rate * 100)}%`;
}
