import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

import {
  CHECK_IN_STATUSES,
  DEFAULT_SLOT_LIMIT,
  HABIT_STATUSES,
  SKIP_REASONS,
} from '@repo/evolin-shared';

export const habitStatusEnum = pgEnum('habit_status', HABIT_STATUSES);
export const checkInStatusEnum = pgEnum('check_in_status', CHECK_IN_STATUSES);
export const skipReasonEnum = pgEnum('skip_reason', SKIP_REASONS);

export const lifeAreas = pgTable('life_areas', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slotLimit: smallint('slot_limit').notNull().default(DEFAULT_SLOT_LIMIT),
});

export const habits = pgTable(
  'habits',
  {
    id: text('id').primaryKey(),
    lifeAreaId: text('life_area_id')
      .notNull()
      .references(() => lifeAreas.id),
    name: text('name').notNull(),
    why: text('why').notNull(),
    trigger: text('trigger').notNull(),
    acceptanceCriteria: text('acceptance_criteria').notNull(),
    checkpointsPerDay: smallint('checkpoints_per_day').notNull(),
    checkpointLabels: text('checkpoint_labels').array(),
    weekdays: smallint('weekdays').array().notNull(),
    status: habitStatusEnum('status').notNull().default('backlog'),
    establishingStartedAt: timestamp('establishing_started_at', {
      withTimezone: true,
      mode: 'date',
    }),
    establishedAt: timestamp('established_at', {
      withTimezone: true,
      mode: 'date',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'habits_name_length_check',
      sql`char_length(${table.name}) between 1 and 80`,
    ),
    check(
      'habits_why_length_check',
      sql`char_length(${table.why}) between 1 and 500`,
    ),
    check(
      'habits_trigger_length_check',
      sql`char_length(${table.trigger}) between 1 and 200`,
    ),
    check(
      'habits_acceptance_criteria_length_check',
      sql`char_length(${table.acceptanceCriteria}) between 1 and 500`,
    ),
    check(
      'habits_checkpoints_per_day_check',
      sql`${table.checkpointsPerDay} between 1 and 12`,
    ),
    check(
      'habits_weekdays_check',
      sql`cardinality(${table.weekdays}) between 1 and 7 and ${table.weekdays} <@ array[1,2,3,4,5,6,7]::smallint[]`,
    ),
    check(
      'habits_checkpoint_labels_check',
      sql`${table.checkpointLabels} is null or cardinality(${table.checkpointLabels}) = ${table.checkpointsPerDay}`,
    ),
    index('habits_status_life_area_idx').on(table.status, table.lifeAreaId),
  ],
);

export const checkIns = pgTable(
  'check_ins',
  {
    id: text('id').primaryKey(),
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    checkInDate: date('check_in_date', { mode: 'string' }).notNull(),
    checkpointIndex: smallint('checkpoint_index').notNull(),
    status: checkInStatusEnum('status').notNull(),
    skipReason: skipReasonEnum('skip_reason'),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('check_ins_habit_date_index_key').on(
      table.habitId,
      table.checkInDate,
      table.checkpointIndex,
    ),
    check(
      'check_ins_index_check',
      sql`${table.checkpointIndex} between 0 and 11`,
    ),
    check(
      'check_ins_skip_reason_check',
      sql`(${table.status} = 'skipped' and ${table.skipReason} is not null) or (${table.status} <> 'skipped' and ${table.skipReason} is null)`,
    ),
    check(
      'check_ins_note_length_check',
      sql`${table.note} is null or char_length(${table.note}) between 1 and 500`,
    ),
    index('check_ins_habit_date_idx').on(table.habitId, table.checkInDate),
  ],
);

export type LifeAreaRow = typeof lifeAreas.$inferSelect;
export type HabitRow = typeof habits.$inferSelect;
export type CheckInRow = typeof checkIns.$inferSelect;
