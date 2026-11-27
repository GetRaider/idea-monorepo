import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  or,
  type SQL,
} from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { addDaysToDate } from "@repo/api/todex";
import type {
  Counter,
  CounterDetail,
  CounterLink,
  CounterStatus,
  CreateCounterBody,
  LogCounterOccurrenceBody,
  LogCounterOccurrenceResult,
  UpdateCounterBody,
} from "@repo/api/todex";

import {
  counterLinks,
  counterOccurrences,
  counterPeriods,
  counters,
  tasks,
  type CounterLinkRow,
  type CounterRow,
} from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";
import {
  advanceCursor,
  closeEndedPeriods,
  hasEndedPeriod,
  lockCounter,
  saveCounter,
} from "./counter-closing";
import {
  countStatus,
  isWithin,
  localDate,
  mondayOf,
  periodContaining,
} from "./counter-periods";
import { toCounter, toCounterOccurrence, trackedPeriod } from "./counter-view";

@Injectable()
export class CountersService {
  private readonly logger = new Logger(CountersService.name);

  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  /** Idempotent; runs on a timer and before reads. */
  async closeDue(workspaceId?: string, now = new Date()): Promise<void> {
    const rows = await this.db
      .select()
      .from(counters)
      .where(
        and(
          eq(counters.status, "active"),
          ...(workspaceId ? [eq(counters.workspaceId, workspaceId)] : []),
        ),
      );
    for (const row of rows) {
      if (!hasEndedPeriod(row, now)) continue;
      try {
        await this.db.transaction(async (tx) => {
          const counter = await lockCounter(tx, row.id);
          if (counter) await closeEndedPeriods(tx, counter, now);
        });
      } catch (error) {
        this.logger.error(
          `Could not close periods of counter ${row.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  async list(
    workspaceId: string,
    status: CounterStatus,
    now = new Date(),
  ): Promise<Counter[]> {
    await this.closeDue(workspaceId, now);
    const rows = await this.db
      .select()
      .from(counters)
      .where(
        and(eq(counters.workspaceId, workspaceId), eq(counters.status, status)),
      )
      .orderBy(asc(counters.createdAt), asc(counters.id));
    return this.summaries(rows, now);
  }

  async get(
    workspaceId: string,
    counterId: string,
    now = new Date(),
  ): Promise<CounterDetail> {
    await this.change(workspaceId, counterId, now, async () => undefined);
    return this.detail(workspaceId, counterId, now);
  }

  async create(
    workspaceId: string,
    body: CreateCounterBody,
    now = new Date(),
  ): Promise<CounterDetail> {
    const today = localDate(now, body.timeZone);
    const id = randomUUID();
    await this.db.insert(counters).values({
      id,
      workspaceId,
      ...body,
      anchorDate: today,
      closedThrough: addDaysToDate(
        periodContaining(body, today, today).start,
        -1,
      ),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    return this.detail(workspaceId, id, now);
  }

  async update(
    workspaceId: string,
    counterId: string,
    body: UpdateCounterBody,
    now = new Date(),
  ): Promise<CounterDetail> {
    await this.change(workspaceId, counterId, now, async (tx, counter) => {
      const renamed = {
        ...counter,
        name: body.name ?? counter.name,
        showInToday: body.showInToday ?? counter.showInToday,
      };
      await saveCounter(tx, withRuleChange(renamed, body, now), now);
    });
    return this.detail(workspaceId, counterId, now);
  }

  async archive(
    workspaceId: string,
    counterId: string,
    now = new Date(),
  ): Promise<CounterDetail> {
    await this.change(workspaceId, counterId, now, async (tx, counter) => {
      if (counter.status === "archived") return;
      await saveCounter(tx, { ...counter, status: "archived" }, now);
    });
    return this.detail(workspaceId, counterId, now);
  }

  async restore(
    workspaceId: string,
    counterId: string,
    now = new Date(),
  ): Promise<CounterDetail> {
    await this.change(workspaceId, counterId, now, async (tx, counter) => {
      if (counter.status === "active") return;
      const today = localDate(now, counter.timeZone);
      const currentEnd = periodContaining(
        counter,
        counter.anchorDate,
        today,
      ).end;
      // Tracking resumes with the next period and never reopens closed days.
      const closedThrough =
        currentEnd > counter.closedThrough ? currentEnd : counter.closedThrough;
      await saveCounter(
        tx,
        { ...advanceCursor(counter, closedThrough), status: "active" },
        now,
      );
    });
    return this.detail(workspaceId, counterId, now);
  }

  async logOccurrence(
    workspaceId: string,
    counterId: string,
    body: LogCounterOccurrenceBody,
    now = new Date(),
  ): Promise<LogCounterOccurrenceResult> {
    const occurrenceId = randomUUID();
    await this.change(workspaceId, counterId, now, async (tx, counter) => {
      const period = trackedPeriod(counter);
      if (!period) {
        throw new BadRequestException("Restore the Counter to log it");
      }
      const today = localDate(now, counter.timeZone);
      const date = body.date ?? today;
      if (!isWithin(period, date) || date > today) {
        throw new BadRequestException(
          "Only days of the open period up to today can be logged",
        );
      }
      if (body.status === "skipped") {
        const logged = await tx
          .select({
            date: counterOccurrences.localDate,
            status: counterOccurrences.status,
          })
          .from(counterOccurrences)
          .where(
            and(
              eq(counterOccurrences.counterId, counter.id),
              gte(counterOccurrences.localDate, period.start),
            ),
          );
        const covered =
          countStatus(logged, "completed") + countStatus(logged, "skipped");
        if (covered >= counter.target) {
          throw new BadRequestException(
            "The Target is already covered, nothing to skip",
          );
        }
      }
      await tx.insert(counterOccurrences).values({
        id: occurrenceId,
        counterId: counter.id,
        localDate: date,
        status: body.status,
        skipReason: body.status === "skipped" ? body.skipReason : null,
        source: "manual",
        createdAt: now,
      });
    });
    return {
      counter: await this.summary(workspaceId, counterId, now),
      occurrenceId,
    };
  }

  async deleteOccurrence(
    workspaceId: string,
    counterId: string,
    occurrenceId: string,
    now = new Date(),
  ): Promise<Counter> {
    await this.change(workspaceId, counterId, now, async (tx, counter) => {
      const [occurrence] = await tx
        .select()
        .from(counterOccurrences)
        .where(
          and(
            eq(counterOccurrences.id, occurrenceId),
            eq(counterOccurrences.counterId, counter.id),
          ),
        );
      if (!occurrence) throw new NotFoundException("Occurrence not found");
      const view = toCounterOccurrence(counter, {
        ...occurrence,
        taskSummary: null,
      });
      if (!view.deletable) {
        throw new BadRequestException(
          "Only manual entries of the open period can be removed",
        );
      }
      await tx
        .delete(counterOccurrences)
        .where(eq(counterOccurrences.id, occurrence.id));
    });
    return this.summary(workspaceId, counterId, now);
  }

  async addLink(
    workspaceId: string,
    counterId: string,
    taskId: string,
    now = new Date(),
  ): Promise<CounterDetail> {
    await this.requireCounter(this.db, workspaceId, counterId);
    const [task] = await this.db
      .select({ id: tasks.id, seriesId: tasks.seriesId })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)));
    if (!task) throw new NotFoundException("Task not found");
    // No Counter lock here: Task completion locks the Task first, then the Counter.
    await this.db
      .insert(counterLinks)
      .values({
        id: randomUUID(),
        counterId,
        taskId: task.seriesId ? null : task.id,
        seriesId: task.seriesId,
        createdAt: now,
      })
      .onConflictDoNothing();
    return this.detail(workspaceId, counterId, now);
  }

  async removeLink(
    workspaceId: string,
    counterId: string,
    linkId: string,
    now = new Date(),
  ): Promise<CounterDetail> {
    await this.requireCounter(this.db, workspaceId, counterId);
    await this.db
      .delete(counterLinks)
      .where(
        and(eq(counterLinks.id, linkId), eq(counterLinks.counterId, counterId)),
      );
    return this.detail(workspaceId, counterId, now);
  }

  /** Locks the Counter, closes ended periods, then applies one write. */
  private async change(
    workspaceId: string,
    counterId: string,
    now: Date,
    write: (tx: NodePgDatabase, counter: CounterRow) => Promise<void>,
  ): Promise<void> {
    await this.requireCounter(this.db, workspaceId, counterId);
    // Committed on its own, so a rejected write never undoes a due closing.
    await this.db.transaction(async (tx) => {
      const counter = await lockCounter(tx, counterId);
      if (counter) await closeEndedPeriods(tx, counter, now);
    });
    await this.db.transaction(async (tx) => {
      const counter = await lockCounter(tx, counterId);
      if (!counter) throw new NotFoundException("Counter not found");
      await write(tx, await closeEndedPeriods(tx, counter, now));
    });
  }

  private async requireCounter(
    db: NodePgDatabase,
    workspaceId: string,
    counterId: string,
  ): Promise<CounterRow> {
    const [counter] = await db
      .select()
      .from(counters)
      .where(
        and(eq(counters.id, counterId), eq(counters.workspaceId, workspaceId)),
      );
    if (!counter) throw new NotFoundException("Counter not found");
    return counter;
  }

  private async summary(workspaceId: string, counterId: string, now: Date) {
    const row = await this.requireCounter(this.db, workspaceId, counterId);
    const [counter] = await this.summaries([row], now);
    if (!counter) throw new NotFoundException("Counter not found");
    return counter;
  }

  /** Loads only what the current week and the open period need. */
  private async summaries(rows: CounterRow[], now: Date): Promise<Counter[]> {
    if (rows.length === 0) return [];
    const bounds = rows.map((row) => {
      const monday = mondayOf(localDate(now, row.timeZone));
      const start = trackedPeriod(row)?.start;
      return {
        id: row.id,
        monday,
        from: start && start < monday ? start : monday,
      };
    });
    const [occurrences, periods] = await Promise.all([
      this.occurrenceRows(
        or(
          ...bounds.map((bound) =>
            and(
              eq(counterOccurrences.counterId, bound.id),
              gte(counterOccurrences.localDate, bound.from),
            ),
          ),
        ),
      ),
      this.db
        .select()
        .from(counterPeriods)
        .where(
          or(
            ...bounds.map((bound) =>
              and(
                eq(counterPeriods.counterId, bound.id),
                gte(counterPeriods.endDate, bound.monday),
              ),
            ),
          ),
        ),
    ]);
    return rows.map((row) =>
      toCounter({
        counter: row,
        occurrences: occurrences
          .filter((occurrence) => occurrence.counterId === row.id)
          .map((occurrence) => toCounterOccurrence(row, occurrence)),
        closedPeriods: periods
          .filter((period) => period.counterId === row.id)
          .map(toClosedPeriod),
        now,
      }),
    );
  }

  private async detail(
    workspaceId: string,
    counterId: string,
    now: Date,
  ): Promise<CounterDetail> {
    const row = await this.requireCounter(this.db, workspaceId, counterId);
    const [occurrences, periods, links] = await Promise.all([
      this.occurrenceRows(eq(counterOccurrences.counterId, row.id)),
      this.db
        .select()
        .from(counterPeriods)
        .where(eq(counterPeriods.counterId, row.id)),
      this.db
        .select()
        .from(counterLinks)
        .where(eq(counterLinks.counterId, row.id))
        .orderBy(asc(counterLinks.createdAt), asc(counterLinks.id)),
    ]);
    const history = occurrences.map((occurrence) =>
      toCounterOccurrence(row, occurrence),
    );
    return {
      ...toCounter({
        counter: row,
        occurrences: history,
        closedPeriods: periods.map(toClosedPeriod),
        now,
      }),
      history,
      links: await this.describeLinks(workspaceId, links),
    };
  }

  private occurrenceRows(where: SQL | undefined) {
    return this.db
      .select({
        ...getTableColumns(counterOccurrences),
        taskSummary: tasks.summary,
      })
      .from(counterOccurrences)
      .leftJoin(tasks, eq(tasks.id, counterOccurrences.taskId))
      .where(where)
      .orderBy(
        desc(counterOccurrences.localDate),
        desc(counterOccurrences.createdAt),
        desc(counterOccurrences.id),
      );
  }

  private async describeLinks(
    workspaceId: string,
    links: CounterLinkRow[],
  ): Promise<CounterLink[]> {
    if (links.length === 0) return [];
    const taskIds = links.flatMap((link) => link.taskId ?? []);
    const seriesIds = links.flatMap((link) => link.seriesId ?? []);
    const rows = await this.db
      .select({
        id: tasks.id,
        summary: tasks.summary,
        taskKey: tasks.taskKey,
        seriesId: tasks.seriesId,
        originSeriesId: tasks.originSeriesId,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          or(
            inArray(tasks.id, taskIds),
            inArray(tasks.seriesId, seriesIds),
            inArray(tasks.originSeriesId, seriesIds),
          ),
        ),
      )
      .orderBy(desc(tasks.createdAt), desc(tasks.id));
    return links.map((link) => {
      const task = rows.find((row) =>
        link.taskId
          ? row.id === link.taskId
          : row.seriesId === link.seriesId ||
            row.originSeriesId === link.seriesId,
      );
      return {
        id: link.id,
        kind: link.seriesId ? "series" : "task",
        taskId: link.taskId,
        seriesId: link.seriesId,
        title: task?.summary ?? "Deleted series",
        taskKey: task?.taskKey ?? null,
      };
    });
  }
}

/**
 * A new Recurrence or Target waits for the next period. It applies at once only
 * when the next period has not started yet.
 */
function withRuleChange(
  counter: CounterRow,
  body: UpdateCounterBody,
  now: Date,
): CounterRow {
  if (body.frequency === undefined && body.target === undefined) return counter;
  const base = counter.pendingChange ?? counter;
  const requested = {
    frequency: body.frequency ?? base.frequency,
    interval: body.interval ?? base.interval,
    target: body.target ?? base.target,
  };
  const unchanged =
    requested.frequency === counter.frequency &&
    requested.interval === counter.interval &&
    requested.target === counter.target;
  if (unchanged) return { ...counter, pendingChange: null };
  const pending = { ...counter, pendingChange: requested };
  const period = trackedPeriod(counter);
  if (period && period.start > localDate(now, counter.timeZone)) {
    return advanceCursor(pending, counter.closedThrough);
  }
  return pending;
}

function toClosedPeriod(period: typeof counterPeriods.$inferSelect) {
  return {
    start: period.startDate,
    end: period.endDate,
    target: period.target,
  };
}
