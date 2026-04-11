export class AnalyticsMetricsHelper {
  private readonly WEEKDAY_LABELS = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ] as const;

  private readonly MS_PER_DAY = 1000 * 60 * 60 * 24;

  buildExtendedDashboardMetrics(
    rows: TaskAnalyticsRow[],
    priorityRows: TaskPriorityRow[],
    now: Date,
  ): ExtendedDashboardMetrics {
    const todayStart = this.startOfLocalDay(now);
    const taskCompletionByDay = this.buildTaskCompletionByDay(rows, todayStart);
    const avgCompletionTimeDaysByWeek = this.buildAvgCompletionTimeDaysByWeek(
      rows,
      this.startOfWeekMonday(now),
    );
    const completionRateByWeekday = this.buildCompletionRateByWeekday(
      rows,
      todayStart,
    );
    const {
      completionRateWeekOverWeekDeltaPp,
      overdueRateWeekOverWeekDeltaPp,
    } = this.buildWeekOverWeekDeltas(rows, todayStart, now);
    const tasksByPriority = this.buildTasksByPriority(priorityRows);

    return {
      completionRateWeekOverWeekDeltaPp,
      overdueRateWeekOverWeekDeltaPp,
      taskCompletionByDay,
      avgCompletionTimeDaysByWeek,
      completionRateByWeekday,
      tasksByPriority,
    };
  }

  private buildTaskCompletionByDay(
    rows: TaskAnalyticsRow[],
    todayStart: Date,
  ): TaskCompletionByDay[] {
    const taskCompletionByDay: TaskCompletionByDay[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const dayStart = this.addLocalDays(todayStart, -offset);
      const dayEnd = this.endOfLocalDay(dayStart);
      const created = rows.filter(
        (task) => task.createdAt >= dayStart && task.createdAt <= dayEnd,
      ).length;
      const completed = rows.filter(
        (task) =>
          task.status === "Done" &&
          task.updatedAt >= dayStart &&
          task.updatedAt <= dayEnd,
      ).length;
      taskCompletionByDay.push({
        date: this.formatLocalDateKey(dayStart),
        label: this.formatShortDayLabel(dayStart),
        created,
        completed,
      });
    }
    return taskCompletionByDay;
  }

  private buildAvgCompletionTimeDaysByWeek(
    rows: TaskAnalyticsRow[],
    currentWeekStart: Date,
  ): AvgCompletionTimeWeek[] {
    const avgCompletionTimeDaysByWeek: AvgCompletionTimeWeek[] = [];
    for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
      const weekStart = this.addLocalDays(
        currentWeekStart,
        (weekIndex - 5) * 7,
      );
      const weekEnd = this.endOfLocalDay(this.addLocalDays(weekStart, 6));
      const completedInWeek = rows.filter(
        (task) =>
          task.status === "Done" &&
          task.updatedAt >= weekStart &&
          task.updatedAt <= weekEnd,
      );
      let avgDays = 0;
      if (completedInWeek.length > 0) {
        const durations = completedInWeek
          .map(
            (task) =>
              (task.updatedAt.getTime() - task.createdAt.getTime()) /
              this.MS_PER_DAY,
          )
          .filter((days) => days >= 0);
        if (durations.length > 0) {
          avgDays =
            Math.round(
              (durations.reduce((sum, days) => sum + days, 0) /
                durations.length) *
                10,
            ) / 10;
        }
      }
      avgCompletionTimeDaysByWeek.push({
        weekLabel: weekStart.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        avgDays,
      });
    }
    return avgCompletionTimeDaysByWeek;
  }

  private buildCompletionRateByWeekday(
    rows: TaskAnalyticsRow[],
    todayStart: Date,
  ): CompletionRateByWeekday[] {
    const lookbackStart = this.addLocalDays(todayStart, -84);
    const rowsInWeekdayWindow = rows.filter(
      (task) => task.createdAt >= lookbackStart,
    );
    const weekdayBuckets: TaskAnalyticsRow[][] = Array.from(
      { length: 7 },
      () => [],
    );
    for (const task of rowsInWeekdayWindow) {
      const index = this.localWeekdayIndexMondayFirst(task.createdAt);
      weekdayBuckets[index].push(task);
    }
    return this.WEEKDAY_LABELS.map((weekday, index) => {
      const bucket = weekdayBuckets[index];
      const ratePercent =
        bucket.length === 0
          ? 0
          : Math.round(this.completionRateForCohort(bucket) * 1000) / 10;
      return { weekday, ratePercent };
    });
  }

  private buildWeekOverWeekDeltas(
    rows: TaskAnalyticsRow[],
    todayStart: Date,
    now: Date,
  ): Pick<
    ExtendedDashboardMetrics,
    "completionRateWeekOverWeekDeltaPp" | "overdueRateWeekOverWeekDeltaPp"
  > {
    const windowCurrentStart = this.addLocalDays(todayStart, -6);
    const windowCurrentEnd = this.endOfLocalDay(now);
    const windowPrevStart = this.addLocalDays(todayStart, -13);
    const windowPrevEnd = this.endOfLocalDay(this.addLocalDays(todayStart, -7));

    const cohortCurrent = rows.filter(
      (task) =>
        task.createdAt >= windowCurrentStart &&
        task.createdAt <= windowCurrentEnd,
    );
    const cohortPrev = rows.filter(
      (task) =>
        task.createdAt >= windowPrevStart && task.createdAt <= windowPrevEnd,
    );

    const rateCurrent = this.completionRateForCohort(cohortCurrent);
    const ratePrev = this.completionRateForCohort(cohortPrev);
    const completionRateWeekOverWeekDeltaPp =
      Math.round((rateCurrent - ratePrev) * 1000) / 10;

    const overdueCurrent = this.overdueRateForCohort(cohortCurrent, now);
    const overduePrev = this.overdueRateForCohort(cohortPrev, windowPrevEnd);
    const overdueRateWeekOverWeekDeltaPp =
      Math.round((overdueCurrent - overduePrev) * 1000) / 10;

    return {
      completionRateWeekOverWeekDeltaPp,
      overdueRateWeekOverWeekDeltaPp,
    };
  }

  private buildTasksByPriority(
    priorityRows: TaskPriorityRow[],
  ): TasksByPriority {
    const tasksByPriority: TasksByPriority = {
      critical: this.emptyPriorityBucket(),
      high: this.emptyPriorityBucket(),
      medium: this.emptyPriorityBucket(),
      low: this.emptyPriorityBucket(),
    };

    for (const row of priorityRows) {
      const bucket = tasksByPriority[row.priority];
      bucket.total += 1;
      if (row.status !== "Done") bucket.unresolved += 1;
    }

    return tasksByPriority;
  }

  private emptyPriorityBucket(): PriorityBucket {
    return { total: 0, unresolved: 0 };
  }

  private startOfLocalDay(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
  }

  private endOfLocalDay(date: Date): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999,
    );
  }

  private addLocalDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private formatLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private formatShortDayLabel(date: Date): string {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }

  private localWeekdayIndexMondayFirst(date: Date): number {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }

  private startOfWeekMonday(date: Date): Date {
    const start = this.startOfLocalDay(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    return start;
  }

  private completionRateForCohort(tasks: TaskAnalyticsRow[]): number {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((task) => task.status === "Done").length;
    return completed / tasks.length;
  }

  private overdueRateForCohort(
    tasks: TaskAnalyticsRow[],
    referenceTime: Date,
  ): number {
    const withDue = tasks.filter((task) => task.dueDate !== null);
    if (withDue.length === 0) return 0;
    const overdue = withDue.filter(
      (task) =>
        task.status !== "Done" &&
        task.dueDate !== null &&
        task.dueDate < referenceTime,
    ).length;
    return overdue / withDue.length;
  }
}

export const analyticsHelper = new AnalyticsMetricsHelper();

export type TaskAnalyticsRow = {
  status: "To Do" | "In Progress" | "Done";
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
};

export type TaskPriorityRow = {
  status: "To Do" | "In Progress" | "Done";
  priority: "low" | "medium" | "high" | "critical";
};

export type TaskCompletionByDay = {
  date: string;
  label: string;
  created: number;
  completed: number;
};

export type AvgCompletionTimeWeek = {
  weekLabel: string;
  avgDays: number;
};

export type CompletionRateByWeekday = {
  weekday: string;
  ratePercent: number;
};

export type PriorityBucket = {
  total: number;
  unresolved: number;
};

export type TasksByPriority = {
  critical: PriorityBucket;
  high: PriorityBucket;
  medium: PriorityBucket;
  low: PriorityBucket;
};

export type ExtendedDashboardMetrics = {
  completionRateWeekOverWeekDeltaPp: number;
  overdueRateWeekOverWeekDeltaPp: number;
  taskCompletionByDay: TaskCompletionByDay[];
  avgCompletionTimeDaysByWeek: AvgCompletionTimeWeek[];
  completionRateByWeekday: CompletionRateByWeekday[];
  tasksByPriority: TasksByPriority;
};
