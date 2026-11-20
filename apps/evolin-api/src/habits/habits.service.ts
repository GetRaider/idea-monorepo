import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  lte,
  sql,
} from 'drizzle-orm';

import {
  ACTIVE_HABIT_MAXIMUM,
  ACTIVE_HABIT_RECOMMENDED,
  IncompletePlanError,
  assertCompletePlan,
  isoWeekday,
  isScheduledWeekday,
  localDateInTimeZone,
  type Capacity,
  type CreateHabitInput,
  type Habit,
  type HabitDetailResponse,
  type HabitListResponse,
  type HabitMutationResponse,
  type HabitStatus,
  type Practice,
  type PracticeHistoryQuery,
  type PutPracticeInput,
  type TransitionHabitInput,
  type UpdateHabitInput,
} from '@repo/evolin-shared';

import { DATABASE, type Database } from '../database/database.module';
import {
  habitStatusEvents,
  habits,
  practiceRecords,
  type HabitRow,
  type HabitStatusEventRow,
  type PracticeRecordRow,
} from '../database/schema';
import { ApiError } from '../http/api-error';
import {
  InvalidTransitionError,
  resolveHabitTransition,
  type HabitAction,
} from './habit-transitions';
import {
  PracticeDateInFutureError,
  PracticeNotAllowedError,
  PracticeNotScheduledError,
  assertPracticeInsertIsScheduled,
  isDateDuringEstablishing,
  recentDates,
  validatePracticeDate,
} from './practice-rules';

@Injectable()
export class HabitsService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async list(input: TransitionHabitInput): Promise<HabitListResponse> {
    this.assertCurrentLocalDate(input);

    const [rows, capacity] = await Promise.all([
      this.database
        .select({ habit: habits, practice: practiceRecords })
        .from(habits)
        .leftJoin(
          practiceRecords,
          and(
            eq(practiceRecords.habitId, habits.id),
            eq(practiceRecords.practiceDate, input.date),
          ),
        )
        .orderBy(
          sql`case ${habits.status}
            when 'establishing' then 1
            when 'paused' then 2
            when 'backlog' then 3
            else 4
          end`,
          desc(habits.updatedAt),
        ),
      this.getCapacity(),
    ]);

    return {
      capacity,
      habits: rows.map(({ habit, practice }) =>
        this.toHabit(habit, input, practice),
      ),
    };
  }

  async create(input: CreateHabitInput): Promise<HabitMutationResponse> {
    this.assertCurrentLocalDate(input);
    const now = new Date();
    const status: HabitStatus = input.startEstablishing
      ? 'establishing'
      : 'backlog';

    const habit = await this.database.transaction(async (transaction) => {
      if (status === 'establishing') {
        this.assertPlanIsComplete(input);
        await transaction.execute(sql`select pg_advisory_xact_lock(841001)`);
        await this.assertCapacityAvailable(transaction);
      }

      const insertedRows = await transaction
        .insert(habits)
        .values({
          id: crypto.randomUUID(),
          title: input.title,
          description: input.description,
          category: input.category,
          why: input.why,
          minimumAction: input.minimumAction,
          trigger: input.trigger,
          weekdays: input.weekdays,
          estimatedDurationMinutes: input.estimatedDurationMinutes,
          status,
          createdAt: now,
          updatedAt: now,
          activatedAt: status === 'establishing' ? now : null,
        })
        .returning();
      const insertedHabit = insertedRows[0];
      if (!insertedHabit) throw new Error('Habit insert returned no row');

      await transaction.insert(habitStatusEvents).values({
        id: crypto.randomUUID(),
        habitId: insertedHabit.id,
        fromStatus: null,
        toStatus: status,
        occurredAt: now,
      });

      return insertedHabit;
    });

    return this.getMutationResponse(habit, input);
  }

  async detail(
    habitId: string,
    input: TransitionHabitInput,
  ): Promise<HabitDetailResponse> {
    this.assertCurrentLocalDate(input);

    const [habit, capacity, practices, events] = await Promise.all([
      this.getHabitRow(habitId),
      this.getCapacity(),
      this.database
        .select()
        .from(practiceRecords)
        .where(eq(practiceRecords.habitId, habitId))
        .orderBy(asc(practiceRecords.practiceDate)),
      this.getStatusEvents(habitId),
    ]);

    const practicesByDate = new Map(
      practices.map((practice) => [practice.practiceDate, practice]),
    );
    const recent = recentDates(input.date, 14).map((date) => ({
      date,
      weekday: isoWeekday(date, input.timeZone),
      inSchedule: isScheduledWeekday(
        habit.weekdays,
        isoWeekday(date, input.timeZone),
      ),
      duringEstablishing: isDateDuringEstablishing(
        date,
        input.timeZone,
        events,
      ),
      outcome: practicesByDate.get(date)?.outcome ?? null,
    }));
    const firstEstablishingEvent = events.find(
      (event) => event.toStatus === 'establishing',
    );
    const establishingDayCount = firstEstablishingEvent
      ? recentDates(
          input.date,
          daysBetween(
            localDateInTimeZone(
              firstEstablishingEvent.occurredAt,
              input.timeZone,
            ),
            input.date,
          ) + 1,
        ).filter((date) =>
          isDateDuringEstablishing(date, input.timeZone, events),
        ).length
      : 0;
    const todayPractice = practicesByDate.get(input.date) ?? null;

    return {
      habit: this.toHabit(habit, input, todayPractice),
      capacity,
      progress: {
        completedCount: practices.filter(
          (practice) => practice.outcome === 'completed',
        ).length,
        skippedCount: practices.filter(
          (practice) => practice.outcome === 'skipped',
        ).length,
        establishingDayCount,
        recent,
      },
    };
  }

  async update(
    habitId: string,
    input: UpdateHabitInput,
  ): Promise<HabitMutationResponse> {
    this.assertCurrentLocalDate(input);
    const { timeZone, date, ...updates } = input;

    const habit = await this.database.transaction(async (transaction) => {
      const currentRows = await transaction
        .select()
        .from(habits)
        .where(eq(habits.id, habitId))
        .limit(1);
      const currentHabit = currentRows[0];
      if (!currentHabit) this.throwHabitNotFound();

      const nextHabit = { ...currentHabit, ...updates };
      if (currentHabit.status !== 'backlog') {
        this.assertPlanIsComplete(nextHabit);
      }

      const updatedRows = await transaction
        .update(habits)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(habits.id, habitId))
        .returning();

      return updatedRows[0] as HabitRow;
    });

    return this.getMutationResponse(habit, { timeZone, date });
  }

  async delete(habitId: string): Promise<void> {
    const deletedRows = await this.database
      .delete(habits)
      .where(eq(habits.id, habitId))
      .returning({ id: habits.id });

    if (deletedRows.length === 0) this.throwHabitNotFound();
  }

  async transition(
    habitId: string,
    action: HabitAction,
    input: TransitionHabitInput,
  ): Promise<HabitMutationResponse> {
    this.assertCurrentLocalDate(input);

    const habit = await this.database.transaction(async (transaction) => {
      const currentRows = await transaction
        .select()
        .from(habits)
        .where(eq(habits.id, habitId))
        .limit(1);
      const currentHabit = currentRows[0];
      if (!currentHabit) this.throwHabitNotFound();

      let nextStatus: HabitStatus;
      try {
        nextStatus = resolveHabitTransition(currentHabit.status, action);
      } catch (error) {
        if (error instanceof InvalidTransitionError) {
          throw new ApiError(409, 'INVALID_TRANSITION', error.message);
        }
        throw error;
      }

      if (nextStatus === currentHabit.status) return currentHabit;

      if (nextStatus === 'establishing') {
        this.assertPlanIsComplete(currentHabit);
        await transaction.execute(sql`select pg_advisory_xact_lock(841001)`);
        await this.assertCapacityAvailable(transaction);
      }

      const now = new Date();
      const timestampUpdates = this.getTransitionTimestamps(
        currentHabit.status,
        nextStatus,
        now,
      );
      const updatedRows = await transaction
        .update(habits)
        .set({
          status: nextStatus,
          updatedAt: now,
          ...timestampUpdates,
        })
        .where(eq(habits.id, habitId))
        .returning();
      const updatedHabit = updatedRows[0];
      if (!updatedHabit) throw new Error('Habit transition returned no row');

      await transaction.insert(habitStatusEvents).values({
        id: crypto.randomUUID(),
        habitId,
        fromStatus: currentHabit.status,
        toStatus: nextStatus,
        occurredAt: now,
      });

      return updatedHabit;
    });

    return this.getMutationResponse(habit, input);
  }

  async putPractice(
    habitId: string,
    date: string,
    input: PutPracticeInput,
  ): Promise<Practice> {
    return this.database.transaction(async (transaction) => {
      const currentRows = await transaction
        .select()
        .from(habits)
        .where(eq(habits.id, habitId))
        .limit(1);
      const habit = currentRows[0];
      if (!habit) this.throwHabitNotFound();
      this.assertPracticeStatus(habit.status);

      const [existingRows, events] = await Promise.all([
        transaction
          .select()
          .from(practiceRecords)
          .where(
            and(
              eq(practiceRecords.habitId, habitId),
              eq(practiceRecords.practiceDate, date),
            ),
          )
          .limit(1),
        transaction
          .select()
          .from(habitStatusEvents)
          .where(eq(habitStatusEvents.habitId, habitId))
          .orderBy(asc(habitStatusEvents.occurredAt)),
      ]);
      const existingPractice = existingRows[0];

      this.runPracticeDateValidation({
        date,
        timeZone: input.timeZone,
        createdAt: habit.createdAt,
        events,
      });
      if (!existingPractice) {
        try {
          assertPracticeInsertIsScheduled(
            date,
            input.timeZone,
            habit.weekdays,
          );
        } catch (error) {
          if (error instanceof PracticeNotScheduledError) {
            throw new ApiError(409, 'PRACTICE_NOT_SCHEDULED', error.message);
          }
          throw error;
        }
      }

      if (existingPractice?.outcome === input.outcome) {
        return this.toPractice(existingPractice);
      }

      const now = new Date();
      const practiceRows = await transaction
        .insert(practiceRecords)
        .values({
          habitId,
          practiceDate: date,
          outcome: input.outcome,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [practiceRecords.habitId, practiceRecords.practiceDate],
          set: { outcome: input.outcome, updatedAt: now },
        })
        .returning();
      await transaction
        .update(habits)
        .set({ updatedAt: now })
        .where(eq(habits.id, habitId));

      const practice = practiceRows[0];
      if (!practice) throw new Error('Practice upsert returned no row');
      return this.toPractice(practice);
    });
  }

  async deletePractice(
    habitId: string,
    date: string,
    timeZone: string,
  ): Promise<void> {
    await this.database.transaction(async (transaction) => {
      const currentRows = await transaction
        .select()
        .from(habits)
        .where(eq(habits.id, habitId))
        .limit(1);
      const habit = currentRows[0];
      if (!habit) this.throwHabitNotFound();

      const existingRows = await transaction
        .select()
        .from(practiceRecords)
        .where(
          and(
            eq(practiceRecords.habitId, habitId),
            eq(practiceRecords.practiceDate, date),
          ),
        )
        .limit(1);
      if (!existingRows[0]) return;

      this.assertPracticeStatus(habit.status);
      const events = await transaction
        .select()
        .from(habitStatusEvents)
        .where(eq(habitStatusEvents.habitId, habitId))
        .orderBy(asc(habitStatusEvents.occurredAt));
      this.runPracticeDateValidation({
        date,
        timeZone,
        createdAt: habit.createdAt,
        events,
      });

      await transaction
        .delete(practiceRecords)
        .where(
          and(
            eq(practiceRecords.habitId, habitId),
            eq(practiceRecords.practiceDate, date),
          ),
        );
      await transaction
        .update(habits)
        .set({ updatedAt: new Date() })
        .where(eq(habits.id, habitId));
    });
  }

  async listPractices(
    habitId: string,
    input: PracticeHistoryQuery,
  ): Promise<{ practices: Practice[] }> {
    await this.getHabitRow(habitId);
    const today = localDateInTimeZone(new Date(), input.timeZone);
    const to = input.to ?? today;
    const from = input.from ?? recentDates(to, 28)[0];
    if (!from) throw new Error('Could not resolve practice range');
    if (from > to) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'The practice range is invalid.',
      );
    }
    if (daysBetween(from, to) + 1 > 366) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'The practice range cannot exceed 366 days.',
      );
    }

    const practices = await this.database
      .select()
      .from(practiceRecords)
      .where(
        and(
          eq(practiceRecords.habitId, habitId),
          gte(practiceRecords.practiceDate, from),
          lte(practiceRecords.practiceDate, to),
        ),
      )
      .orderBy(asc(practiceRecords.practiceDate));

    return { practices: practices.map((practice) => this.toPractice(practice)) };
  }

  private async getHabitRow(habitId: string): Promise<HabitRow> {
    const rows = await this.database
      .select()
      .from(habits)
      .where(eq(habits.id, habitId))
      .limit(1);
    const habit = rows[0];
    if (!habit) this.throwHabitNotFound();
    return habit;
  }

  private async getStatusEvents(
    habitId: string,
  ): Promise<HabitStatusEventRow[]> {
    return this.database
      .select()
      .from(habitStatusEvents)
      .where(eq(habitStatusEvents.habitId, habitId))
      .orderBy(asc(habitStatusEvents.occurredAt));
  }

  private async getCapacity(): Promise<Capacity> {
    const rows = await this.database
      .select({ value: count() })
      .from(habits)
      .where(eq(habits.status, 'establishing'));

    return {
      used: rows[0]?.value ?? 0,
      recommended: ACTIVE_HABIT_RECOMMENDED,
      maximum: ACTIVE_HABIT_MAXIMUM,
    };
  }

  private async assertCapacityAvailable(
    transaction: Parameters<
      Parameters<Database['transaction']>[0]
    >[0],
  ): Promise<void> {
    const rows = await transaction
      .select({ value: count() })
      .from(habits)
      .where(eq(habits.status, 'establishing'));
    const used = rows[0]?.value ?? 0;

    if (used >= ACTIVE_HABIT_MAXIMUM) {
      throw new ApiError(
        409,
        'CAPACITY_EXCEEDED',
        'You can establish at most 3 habits at once.',
        { used, maximum: ACTIVE_HABIT_MAXIMUM },
      );
    }
  }

  private async getMutationResponse(
    habit: HabitRow,
    input: TransitionHabitInput,
  ): Promise<HabitMutationResponse> {
    const [capacity, practices] = await Promise.all([
      this.getCapacity(),
      this.database
        .select()
        .from(practiceRecords)
        .where(
          and(
            eq(practiceRecords.habitId, habit.id),
            eq(practiceRecords.practiceDate, input.date),
          ),
        )
        .limit(1),
    ]);

    return {
      habit: this.toHabit(habit, input, practices[0] ?? null),
      capacity,
    };
  }

  private toHabit(
    habit: HabitRow,
    input: TransitionHabitInput,
    todayPractice: PracticeRecordRow | null,
  ): Habit {
    return {
      id: habit.id,
      title: habit.title,
      description: habit.description,
      category: habit.category,
      why: habit.why,
      minimumAction: habit.minimumAction,
      trigger: habit.trigger,
      weekdays: habit.weekdays,
      estimatedDurationMinutes: habit.estimatedDurationMinutes,
      status: habit.status,
      createdAt: habit.createdAt.toISOString(),
      updatedAt: habit.updatedAt.toISOString(),
      activatedAt: habit.activatedAt?.toISOString() ?? null,
      pausedAt: habit.pausedAt?.toISOString() ?? null,
      establishedAt: habit.establishedAt?.toISOString() ?? null,
      scheduledToday:
        habit.status === 'establishing' &&
        isScheduledWeekday(
          habit.weekdays,
          isoWeekday(input.date, input.timeZone),
        ),
      todayPractice: todayPractice
        ? {
            date: todayPractice.practiceDate,
            outcome: todayPractice.outcome,
          }
        : null,
    };
  }

  private toPractice(practice: PracticeRecordRow): Practice {
    return {
      habitId: practice.habitId,
      practiceDate: practice.practiceDate,
      outcome: practice.outcome,
      createdAt: practice.createdAt.toISOString(),
      updatedAt: practice.updatedAt.toISOString(),
    };
  }

  private assertCurrentLocalDate(input: TransitionHabitInput): void {
    const today = localDateInTimeZone(new Date(), input.timeZone);
    if (input.date !== today) {
      throw new ApiError(
        400,
        'DATE_TIMEZONE_MISMATCH',
        'The date must be today in the supplied timezone.',
      );
    }
  }

  private assertPlanIsComplete(plan: {
    why: string | null;
    minimumAction: string | null;
    trigger: string | null;
    weekdays: number[] | null;
    estimatedDurationMinutes: number | null;
  }): void {
    try {
      assertCompletePlan(plan);
    } catch (error) {
      if (error instanceof IncompletePlanError) {
        throw new ApiError(
          409,
          'PLAN_INCOMPLETE',
          error.message,
          { fields: error.fields },
        );
      }
      throw error;
    }
  }

  private assertPracticeStatus(status: HabitStatus): void {
    if (status !== 'establishing' && status !== 'paused') {
      throw new ApiError(
        409,
        'PRACTICE_NOT_ALLOWED',
        'Practice cannot be changed for this habit.',
      );
    }
  }

  private runPracticeDateValidation(input: {
    date: string;
    timeZone: string;
    createdAt: Date;
    events: HabitStatusEventRow[];
  }): void {
    try {
      validatePracticeDate({
        ...input,
        now: new Date(),
      });
    } catch (error) {
      if (error instanceof PracticeDateInFutureError) {
        throw new ApiError(409, 'PRACTICE_DATE_IN_FUTURE', error.message);
      }
      if (error instanceof PracticeNotAllowedError) {
        throw new ApiError(409, 'PRACTICE_NOT_ALLOWED', error.message);
      }
      throw error;
    }
  }

  private getTransitionTimestamps(
    currentStatus: HabitStatus,
    nextStatus: HabitStatus,
    now: Date,
  ): Partial<HabitRow> {
    if (nextStatus === 'establishing') {
      return { activatedAt: now, pausedAt: null };
    }
    if (nextStatus === 'paused') return { pausedAt: now };
    if (nextStatus === 'established') {
      return { establishedAt: now, pausedAt: null };
    }
    if (nextStatus === 'backlog') {
      return { activatedAt: null, pausedAt: null };
    }

    return {};
  }

  private throwHabitNotFound(): never {
    throw new ApiError(404, 'HABIT_NOT_FOUND', 'Habit not found.');
  }
}

function daysBetween(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00.000Z`).getTime();
  const end = new Date(`${to}T00:00:00.000Z`).getTime();
  return Math.floor((end - start) / 86_400_000);
}
