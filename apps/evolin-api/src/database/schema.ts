import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import {
  HABIT_CATEGORIES,
  HABIT_STATUSES,
  PRACTICE_OUTCOMES,
} from '@repo/evolin-shared';

export const habitStatusEnum = pgEnum('habit_status', HABIT_STATUSES);
export const habitCategoryEnum = pgEnum('habit_category', HABIT_CATEGORIES);
export const practiceOutcomeEnum = pgEnum(
  'practice_outcome',
  PRACTICE_OUTCOMES,
);

export const habits = pgTable(
  'habits',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    category: habitCategoryEnum('category').notNull(),
    why: text('why'),
    minimumAction: text('minimum_action'),
    trigger: text('trigger'),
    weekdays: smallint('weekdays').array(),
    estimatedDurationMinutes: smallint('estimated_duration_minutes'),
    status: habitStatusEnum('status').notNull().default('backlog'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    activatedAt: timestamp('activated_at', {
      withTimezone: true,
      mode: 'date',
    }),
    pausedAt: timestamp('paused_at', { withTimezone: true, mode: 'date' }),
    establishedAt: timestamp('established_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [
    check(
      'habits_title_length_check',
      sql`char_length(${table.title}) between 1 and 80`,
    ),
    check(
      'habits_description_length_check',
      sql`${table.description} is null or char_length(${table.description}) <= 500`,
    ),
    check(
      'habits_why_length_check',
      sql`${table.why} is null or char_length(${table.why}) between 1 and 500`,
    ),
    check(
      'habits_minimum_action_length_check',
      sql`${table.minimumAction} is null or char_length(${table.minimumAction}) between 1 and 200`,
    ),
    check(
      'habits_trigger_length_check',
      sql`${table.trigger} is null or char_length(${table.trigger}) between 1 and 200`,
    ),
    check(
      'habits_duration_check',
      sql`${table.estimatedDurationMinutes} is null or ${table.estimatedDurationMinutes} between 1 and 180`,
    ),
    check(
      'habits_weekdays_check',
      sql`${table.weekdays} is null or (
        cardinality(${table.weekdays}) between 1 and 7
        and ${table.weekdays} <@ array[1,2,3,4,5,6,7]::smallint[]
      )`,
    ),
    check(
      'habits_complete_plan_check',
      sql`${table.status} = 'backlog' or (
        ${table.why} is not null
        and ${table.minimumAction} is not null
        and ${table.trigger} is not null
        and ${table.weekdays} is not null
        and ${table.estimatedDurationMinutes} is not null
      )`,
    ),
    index('habits_status_updated_idx').on(table.status, table.updatedAt),
  ],
);

export const practiceRecords = pgTable(
  'practice_records',
  {
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    practiceDate: date('practice_date', { mode: 'string' }).notNull(),
    outcome: practiceOutcomeEnum('outcome').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.habitId, table.practiceDate] }),
  ],
);

export const habitStatusEvents = pgTable(
  'habit_status_events',
  {
    id: text('id').primaryKey(),
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    fromStatus: habitStatusEnum('from_status'),
    toStatus: habitStatusEnum('to_status').notNull(),
    occurredAt: timestamp('occurred_at', {
      withTimezone: true,
      mode: 'date',
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('habit_status_events_habit_occurred_idx').on(
      table.habitId,
      table.occurredAt,
    ),
  ],
);

export type HabitRow = typeof habits.$inferSelect;
export type PracticeRecordRow = typeof practiceRecords.$inferSelect;
export type HabitStatusEventRow = typeof habitStatusEvents.$inferSelect;
