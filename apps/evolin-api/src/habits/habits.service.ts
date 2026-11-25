import { Inject, Injectable, type OnModuleInit } from "@nestjs/common";
import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";

import {
  LIFE_AREAS,
  addDays,
  currentStreak,
  isoDateSchema,
  isoWeekday,
  isScheduledWeekday,
  localDateInTimeZone,
  summarizeEstablishment,
  weekCellState,
  type CheckIn,
  type CreateHabitInput,
  type Habit,
  type HabitDetailResponse,
  type HabitListResponse,
  type HabitMutationResponse,
  type LifeArea,
  type PutCheckInInput,
  type RequestContext,
  type TodayCheckpoint,
  type UpdateHabitInput,
  type WeekResponse,
} from "@repo/evolin-shared";

import { DATABASE, type Database } from "../database/database.module";
import {
  checkIns,
  habits,
  lifeAreas,
  type CheckInRow,
  type HabitRow,
  type LifeAreaRow,
} from "../database/schema";
import { ApiError } from "../http/api-error";

@Injectable()
export class HabitsService implements OnModuleInit {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async onModuleInit(): Promise<void> {
    await this.database
      .insert(lifeAreas)
      .values(
        LIFE_AREAS.map((lifeArea) => ({
          id: lifeArea.id,
          name: lifeArea.name,
          slotLimit: lifeArea.slotLimit,
        })),
      )
      .onConflictDoNothing();
  }

  async list(input: RequestContext): Promise<HabitListResponse> {
    this.assertCurrentLocalDate(input);
    const [lifeAreaViews, habitRows, checkInRows] = await Promise.all([
      this.listLifeAreas(),
      this.database
        .select()
        .from(habits)
        .orderBy(
          sql`case ${habits.status}
            when 'establishing' then 1
            when 'backlog' then 2
            else 3
          end`,
          asc(habits.name),
        ),
      this.database.select().from(checkIns),
    ]);
    const checkInsByHabit = groupCheckIns(checkInRows);

    return {
      lifeAreas: lifeAreaViews,
      habits: habitRows.map((habit) =>
        this.toHabit(habit, checkInsByHabit.get(habit.id) ?? [], input),
      ),
    };
  }

  async week(input: RequestContext): Promise<WeekResponse> {
    const today = localDateInTimeZone(new Date(), input.timeZone);
    if (input.date > today) {
      throw new ApiError(
        400,
        "DATE_IN_FUTURE",
        "That week has not happened yet.",
      );
    }

    const dates = Array.from({ length: 7 }, (_, index) =>
      addDays(input.date, index - 6),
    );
    const [habitRows, checkInRows] = await Promise.all([
      this.database.select().from(habits).orderBy(asc(habits.name)),
      this.database.select().from(checkIns),
    ]);
    const checkInsByHabit = groupCheckIns(checkInRows);
    const streakContext = { timeZone: input.timeZone, date: today };

    return {
      anchorDate: input.date,
      days: dates.map((date) => ({ date })),
      habits: habitRows
        .filter((habit) => habit.status !== "backlog")
        .map((habit) => {
          const habitCheckIns = checkInsByHabit.get(habit.id) ?? [];
          const view = this.toHabit(habit, habitCheckIns, streakContext);
          return {
            id: habit.id,
            name: habit.name,
            lifeAreaId: view.lifeAreaId,
            status: habit.status,
            streak: view.streak,
            checkpointsPerDay: habit.checkpointsPerDay,
            days: dates.map((date) => ({
              date,
              state: weekCellState({
                scheduled: isTrackedOnDate(habit, date, input.timeZone),
                checkpointsPerDay: habit.checkpointsPerDay,
                checkIns: habitCheckIns
                  .filter((checkIn) => checkIn.checkInDate === date)
                  .map((checkIn) => ({ status: checkIn.status })),
              }),
            })),
          };
        }),
    };
  }

  async create(input: CreateHabitInput): Promise<HabitMutationResponse> {
    await this.requireLifeArea(input.lifeAreaId);
    const now = new Date();
    const insertedRows = await this.database
      .insert(habits)
      .values({
        id: crypto.randomUUID(),
        lifeAreaId: input.lifeAreaId,
        name: input.name,
        why: input.why,
        trigger: input.trigger,
        acceptanceCriteria: input.acceptanceCriteria,
        checkpointsPerDay: input.checkpointsPerDay,
        checkpointLabels: input.checkpointLabels,
        weekdays: input.weekdays,
        status: "backlog",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    const insertedHabit = insertedRows[0];
    if (!insertedHabit) throw new Error("Habit insert returned no row");

    return this.presentHabit(insertedHabit.id, {
      timeZone: "UTC",
      date: localDateInTimeZone(new Date(), "UTC"),
    });
  }

  async detail(
    habitId: string,
    input: RequestContext,
  ): Promise<HabitDetailResponse> {
    this.assertCurrentLocalDate(input);
    const habit = await this.getHabitRow(habitId);
    const [checkInRows, lifeAreaViews] = await Promise.all([
      this.database
        .select()
        .from(checkIns)
        .where(eq(checkIns.habitId, habitId))
        .orderBy(desc(checkIns.checkInDate), asc(checkIns.checkpointIndex)),
      this.listLifeAreas(),
    ]);
    const lifeArea = lifeAreaViews.find((area) => area.id === habit.lifeAreaId);
    if (!lifeArea) throw new Error("Life area missing for habit");

    return {
      habit: this.toHabit(habit, checkInRows, input),
      lifeArea,
      checkIns: checkInRows.map(toCheckIn),
    };
  }

  async update(
    habitId: string,
    input: UpdateHabitInput,
  ): Promise<HabitMutationResponse> {
    this.assertCurrentLocalDate(input);
    const updates = {
      lifeAreaId: input.lifeAreaId,
      name: input.name,
      why: input.why,
      trigger: input.trigger,
      acceptanceCriteria: input.acceptanceCriteria,
      checkpointsPerDay: input.checkpointsPerDay,
      checkpointLabels: input.checkpointLabels,
      weekdays: input.weekdays,
    };

    await this.database.transaction(async (transaction) => {
      const currentHabit = await this.getHabitRow(habitId, transaction);
      if (
        updates.lifeAreaId &&
        updates.lifeAreaId !== currentHabit.lifeAreaId &&
        currentHabit.status !== "backlog"
      ) {
        throw new ApiError(
          409,
          "LIFE_AREA_LOCKED",
          "Life area can change only while the habit is in the backlog.",
        );
      }
      if (updates.lifeAreaId)
        await this.requireLifeArea(updates.lifeAreaId, transaction);

      const checkpointsPerDay =
        updates.checkpointsPerDay ?? currentHabit.checkpointsPerDay;
      const checkpointLabels =
        updates.checkpointLabels === undefined
          ? currentHabit.checkpointLabels
          : updates.checkpointLabels;
      if (checkpointLabels && checkpointLabels.length !== checkpointsPerDay) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Provide one label per checkpoint, or none.",
        );
      }
      if (checkpointsPerDay < currentHabit.checkpointsPerDay) {
        const keptRows = await transaction
          .select({ id: checkIns.id })
          .from(checkIns)
          .where(
            and(
              eq(checkIns.habitId, habitId),
              gte(checkIns.checkpointIndex, checkpointsPerDay),
            ),
          )
          .limit(1);
        if (keptRows[0]) {
          throw new ApiError(
            409,
            "HISTORY_CONFLICT",
            "Checkpoints that already have history cannot be removed.",
          );
        }
      }

      await transaction
        .update(habits)
        .set({
          ...updates,
          checkpointsPerDay,
          checkpointLabels,
          updatedAt: new Date(),
        })
        .where(eq(habits.id, habitId));
    });

    return this.presentHabit(habitId, {
      timeZone: input.timeZone,
      date: input.date,
    });
  }

  async delete(habitId: string): Promise<void> {
    const deletedRows = await this.database
      .delete(habits)
      .where(eq(habits.id, habitId))
      .returning({ id: habits.id });
    if (deletedRows.length === 0) this.throwHabitNotFound();
  }

  async startEstablishing(
    habitId: string,
    input: RequestContext,
  ): Promise<HabitMutationResponse> {
    this.assertCurrentLocalDate(input);

    await this.database.transaction(async (transaction) => {
      const currentHabit = await this.getHabitRow(habitId, transaction);
      if (currentHabit.status !== "backlog") {
        throw new ApiError(
          409,
          "INVALID_TRANSITION",
          "Only a backlog habit can start establishing.",
        );
      }

      const lifeArea = await this.requireLifeArea(
        currentHabit.lifeAreaId,
        transaction,
      );
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtext(${lifeArea.id}))`,
      );
      const used = await this.countEstablishing(lifeArea.id, transaction);
      if (used >= lifeArea.slotLimit) {
        throw new ApiError(
          409,
          "AREA_FULL",
          `${lifeArea.name} is full. ${used} of ${lifeArea.slotLimit} slots are used.`,
          {
            lifeAreaId: lifeArea.id,
            lifeAreaName: lifeArea.name,
            slotLimit: lifeArea.slotLimit,
            slotsUsed: used,
          },
        );
      }

      const now = new Date();
      await transaction
        .update(habits)
        .set({
          status: "establishing",
          establishingStartedAt: now,
          updatedAt: now,
        })
        .where(eq(habits.id, habitId));
    });

    return this.presentHabit(habitId, input);
  }

  async putCheckIn(
    habitId: string,
    date: string,
    checkpointIndex: number,
    input: PutCheckInInput,
  ): Promise<HabitMutationResponse> {
    const checkInDate = isoDateSchema.parse(date);
    const today = localDateInTimeZone(new Date(), input.timeZone);
    if (checkInDate !== today) {
      throw new ApiError(
        409,
        "CHECK_IN_DATE_LOCKED",
        "Only today can be checked in.",
      );
    }

    await this.database.transaction(async (transaction) => {
      const habit = await this.getHabitRow(habitId, transaction);
      if (habit.status !== "establishing") {
        throw new ApiError(
          409,
          "CHECK_IN_NOT_ALLOWED",
          "Check-ins are recorded while a habit is establishing.",
        );
      }
      if (
        !isScheduledWeekday(
          habit.weekdays,
          isoWeekday(checkInDate, input.timeZone),
        )
      ) {
        throw new ApiError(
          409,
          "NOT_SCHEDULED",
          "This habit is not scheduled today.",
        );
      }
      if (checkpointIndex >= habit.checkpointsPerDay) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "That checkpoint does not exist on this habit.",
        );
      }

      const now = new Date();
      await transaction
        .insert(checkIns)
        .values({
          id: crypto.randomUUID(),
          habitId,
          checkInDate,
          checkpointIndex,
          status: input.status,
          skipReason: input.skipReason,
          note: input.note,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            checkIns.habitId,
            checkIns.checkInDate,
            checkIns.checkpointIndex,
          ],
          set: {
            status: input.status,
            skipReason: input.skipReason,
            note: input.note,
            updatedAt: now,
          },
        });

      const habitCheckIns = await transaction
        .select()
        .from(checkIns)
        .where(eq(checkIns.habitId, habitId));
      const startedOn = habit.establishingStartedAt
        ? localDateInTimeZone(habit.establishingStartedAt, input.timeZone)
        : null;
      if (!startedOn)
        throw new Error("Establishing habit is missing a start date");

      const summary = summarizeEstablishment({
        establishingStartedOn: startedOn,
        asOfDate: today,
        checkIns: habitCheckIns.map(toDatedCheckIn),
      });
      if (summary.established) {
        await transaction
          .update(habits)
          .set({
            status: "established",
            establishedAt: now,
            updatedAt: now,
          })
          .where(eq(habits.id, habitId));
      } else {
        await transaction
          .update(habits)
          .set({ updatedAt: now })
          .where(eq(habits.id, habitId));
      }
    });

    return this.presentHabit(habitId, {
      timeZone: input.timeZone,
      date: today,
    });
  }

  private async presentHabit(
    habitId: string,
    input: RequestContext,
  ): Promise<HabitMutationResponse> {
    const habit = await this.getHabitRow(habitId);
    const [checkInRows, lifeAreaViews] = await Promise.all([
      this.database
        .select()
        .from(checkIns)
        .where(eq(checkIns.habitId, habitId)),
      this.listLifeAreas(),
    ]);

    return {
      habit: this.toHabit(habit, checkInRows, input),
      lifeAreas: lifeAreaViews,
    };
  }

  private toHabit(
    habit: HabitRow,
    habitCheckIns: readonly CheckInRow[],
    input: RequestContext,
  ): Habit {
    const startedOn = habit.establishingStartedAt
      ? localDateInTimeZone(habit.establishingStartedAt, input.timeZone)
      : null;
    const asOfDate =
      habit.status === "established" && habit.establishedAt
        ? localDateInTimeZone(habit.establishedAt, input.timeZone)
        : input.date;
    const datedCheckIns = habitCheckIns.map(toDatedCheckIn);
    const summary = startedOn
      ? summarizeEstablishment({
          establishingStartedOn: startedOn,
          asOfDate,
          checkIns: datedCheckIns,
        })
      : null;
    const weekday = isoWeekday(input.date, input.timeZone);
    const todayByIndex = new Map(
      habitCheckIns
        .filter((checkIn) => checkIn.checkInDate === input.date)
        .map((checkIn) => [checkIn.checkpointIndex, checkIn]),
    );
    const todayCheckpoints: TodayCheckpoint[] = Array.from(
      { length: habit.checkpointsPerDay },
      (_, checkpointIndex) => {
        const checkIn = todayByIndex.get(checkpointIndex);
        return {
          index: checkpointIndex,
          label: habit.checkpointLabels?.[checkpointIndex] ?? null,
          status: checkIn?.status ?? "open",
          skipReason: checkIn?.skipReason ?? null,
          note: checkIn?.note ?? null,
        };
      },
    );

    return {
      id: habit.id,
      lifeAreaId: habit.lifeAreaId as Habit["lifeAreaId"],
      name: habit.name,
      why: habit.why,
      trigger: habit.trigger,
      acceptanceCriteria: habit.acceptanceCriteria,
      checkpointsPerDay: habit.checkpointsPerDay,
      checkpointLabels: habit.checkpointLabels,
      weekdays: habit.weekdays ?? [],
      status: habit.status,
      establishingStartedAt: habit.establishingStartedAt?.toISOString() ?? null,
      establishedAt: habit.establishedAt?.toISOString() ?? null,
      createdAt: habit.createdAt.toISOString(),
      updatedAt: habit.updatedAt.toISOString(),
      scheduledToday:
        habit.status === "establishing" &&
        isScheduledWeekday(habit.weekdays, weekday),
      establishingDay:
        habit.status === "establishing"
          ? (summary?.establishingDay ?? null)
          : null,
      completionRate: summary?.completionRate ?? null,
      windowCounts: summary?.counts ?? { completed: 0, failed: 0, skipped: 0 },
      streak:
        habit.status === "establishing" && startedOn
          ? currentStreak({
              today: input.date,
              weekdays: habit.weekdays ?? [],
              timeZone: input.timeZone,
              checkpointsPerDay: habit.checkpointsPerDay,
              checkIns: datedCheckIns,
              activeFrom: startedOn,
            })
          : 0,
      todayCheckpoints,
    };
  }

  private async listLifeAreas(): Promise<LifeArea[]> {
    const [areaRows, usedRows] = await Promise.all([
      this.database.select().from(lifeAreas).orderBy(asc(lifeAreas.name)),
      this.database
        .select({
          lifeAreaId: habits.lifeAreaId,
          value: count(),
        })
        .from(habits)
        .where(eq(habits.status, "establishing"))
        .groupBy(habits.lifeAreaId),
    ]);
    const usedByArea = new Map(
      usedRows.map((row) => [row.lifeAreaId, row.value]),
    );

    return areaRows.map((area) => ({
      id: area.id as LifeArea["id"],
      name: area.name,
      slotLimit: area.slotLimit,
      slotsUsed: usedByArea.get(area.id) ?? 0,
    }));
  }

  private async countEstablishing(
    lifeAreaId: string,
    transaction: DatabaseExecutor,
  ): Promise<number> {
    const rows = await transaction
      .select({ value: count() })
      .from(habits)
      .where(
        and(
          eq(habits.status, "establishing"),
          eq(habits.lifeAreaId, lifeAreaId),
        ),
      );
    return rows[0]?.value ?? 0;
  }

  private async requireLifeArea(
    lifeAreaId: string,
    transaction: DatabaseExecutor = this.database,
  ): Promise<LifeAreaRow> {
    const rows = await transaction
      .select()
      .from(lifeAreas)
      .where(eq(lifeAreas.id, lifeAreaId))
      .limit(1);
    const lifeArea = rows[0];
    if (!lifeArea) {
      throw new ApiError(400, "UNKNOWN_LIFE_AREA", "Choose a life area.");
    }
    return lifeArea;
  }

  private async getHabitRow(
    habitId: string,
    transaction: DatabaseExecutor = this.database,
  ): Promise<HabitRow> {
    const rows = await transaction
      .select()
      .from(habits)
      .where(eq(habits.id, habitId))
      .limit(1);
    const habit = rows[0];
    if (!habit) this.throwHabitNotFound();
    return habit;
  }

  private assertCurrentLocalDate(input: RequestContext): void {
    const today = localDateInTimeZone(new Date(), input.timeZone);
    if (input.date !== today) {
      throw new ApiError(
        400,
        "DATE_TIMEZONE_MISMATCH",
        "The date must be today in the supplied timezone.",
      );
    }
  }

  private throwHabitNotFound(): never {
    throw new ApiError(404, "HABIT_NOT_FOUND", "Habit not found.");
  }
}

function groupCheckIns(rows: readonly CheckInRow[]): Map<string, CheckInRow[]> {
  const grouped = new Map<string, CheckInRow[]>();
  for (const row of rows) {
    const habitCheckIns = grouped.get(row.habitId) ?? [];
    habitCheckIns.push(row);
    grouped.set(row.habitId, habitCheckIns);
  }
  return grouped;
}

function toDatedCheckIn(checkIn: CheckInRow) {
  return {
    date: checkIn.checkInDate,
    checkpointIndex: checkIn.checkpointIndex,
    status: checkIn.status,
  };
}

function toCheckIn(checkIn: CheckInRow): CheckIn {
  return {
    id: checkIn.id,
    habitId: checkIn.habitId,
    date: checkIn.checkInDate,
    checkpointIndex: checkIn.checkpointIndex,
    status: checkIn.status,
    skipReason: checkIn.skipReason,
    note: checkIn.note,
    createdAt: checkIn.createdAt.toISOString(),
    updatedAt: checkIn.updatedAt.toISOString(),
  };
}

function isTrackedOnDate(
  habit: HabitRow,
  date: string,
  timeZone: string,
): boolean {
  if (habit.status === "backlog" || !habit.establishingStartedAt) return false;
  const startedOn = localDateInTimeZone(habit.establishingStartedAt, timeZone);
  if (date < startedOn) return false;
  if (habit.status === "established" && habit.establishedAt) {
    const establishedOn = localDateInTimeZone(habit.establishedAt, timeZone);
    if (date > establishedOn) return false;
  }
  return isScheduledWeekday(habit.weekdays, isoWeekday(date, timeZone));
}

type DatabaseExecutor = Pick<
  Database,
  "select" | "execute" | "insert" | "update" | "delete"
>;
