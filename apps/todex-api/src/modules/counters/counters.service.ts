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
  inArray,
  max,
  ne,
  type SQL,
} from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { addDaysToDate, positionAfterHighest } from "@repo/api/todex";
import type {
  Counter,
  CounterDetail,
  CounterLink,
  CounterStatus,
  CreateCounterBody,
  SetCounterDayBody,
  UpdateCounterBody,
} from "@repo/api/todex";

import {
  counterDays,
  counterLinks,
  counterOccurrences,
  counters,
  counterSections,
  counterSpaces,
  spaces,
  tasks,
  type CounterLinkRow,
  type CounterRow,
} from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";
import {
  closeEndedDays,
  hasEndedDay,
  lockCounter,
  saveCounter,
  saveDay,
} from "./counter-closing";
import { dropLinksInSpaces, resolveLinks } from "./counter-links";
import { planDay } from "./counter-days";
import { isSameSchedule, isScheduled, localDate } from "./counter-schedule";
import {
  applyRule,
  targetResolver,
  toCounter,
  toCounterOccurrence,
} from "./counter-view";

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
      if (!hasEndedDay(row, now)) continue;
      try {
        await this.db.transaction(async (tx) => {
          const counter = await lockCounter(tx, row.id);
          if (counter) await closeEndedDays(tx, counter, now);
        });
      } catch (error) {
        this.logger.error(
          `Could not close days of counter ${row.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  async list(
    workspaceId: string,
    status: CounterStatus,
    now = new Date(),
    until?: string,
  ): Promise<Counter[]> {
    await this.closeDue(workspaceId, now);
    const rows = await this.db
      .select()
      .from(counters)
      .where(
        and(eq(counters.workspaceId, workspaceId), eq(counters.status, status)),
      )
      .orderBy(
        asc(counters.position),
        asc(counters.createdAt),
        asc(counters.id),
      );
    return this.summaries(rows, now, until);
  }

  async get(
    workspaceId: string,
    counterId: string,
    now = new Date(),
    until?: string,
  ): Promise<CounterDetail> {
    await this.change(workspaceId, counterId, now, async () => undefined);
    return this.detail(workspaceId, counterId, now, until);
  }

  async create(
    workspaceId: string,
    body: CreateCounterBody,
    now = new Date(),
  ): Promise<CounterDetail> {
    await this.requireSection(workspaceId, body.sectionId);
    const today = localDate(now, body.timeZone);
    const id = randomUUID();
    const [last] = await this.db
      .select({ position: max(counters.position) })
      .from(counters)
      .where(eq(counters.workspaceId, workspaceId));
    await this.db.insert(counters).values({
      id,
      workspaceId,
      ...body,
      // Zod infers optional keys without strict null checks.
      schedule: body.schedule!,
      position: positionAfterHighest(last?.position ?? null),
      anchorDate: today,
      closedThrough: addDaysToDate(today, -1),
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
    await this.requireSection(workspaceId, body.sectionId);
    await this.requireSpaces(workspaceId, body.spaceIds ?? []);
    await this.change(workspaceId, counterId, now, async (tx, counter) => {
      const spaceIds = await this.linkSpaces(tx, counter, body.spaceIds, now);
      const renamed = {
        ...counter,
        name: body.name ?? counter.name,
        showInToday: body.showInToday ?? counter.showInToday,
        position: body.position ?? counter.position,
        sectionId:
          body.sectionId === undefined ? counter.sectionId : body.sectionId,
        color: body.color ?? counter.color,
        // Counting any Task means nothing without a linked space.
        countsAnyTask:
          spaceIds.length > 0 && (body.countsAnyTask ?? counter.countsAnyTask),
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
      const today = localDate(now, counter.timeZone);
      const target = targetResolver(
        counter,
        await this.daysOf(tx, counter.id),
        today,
      )(today);
      // Today stops being required, so whatever it holds is kept as it is.
      if (target !== null) {
        const day = { date: today, target, required: false };
        await saveDay(tx, counter.id, day, now);
      }
      await saveCounter(
        tx,
        {
          ...counter,
          status: "archived",
          closedThrough: laterDate(counter.closedThrough, today),
        },
        now,
      );
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
      const resumed = counter.pendingChange
        ? applyRule(counter, counter.pendingChange, today)
        : counter;
      // Tracking resumes tomorrow; today may be marked but cannot fail.
      await saveCounter(
        tx,
        {
          ...resumed,
          status: "active",
          closedThrough: laterDate(counter.closedThrough, today),
        },
        now,
      );
    });
    return this.detail(workspaceId, counterId, now);
  }

  /** Sets one day as a whole; safe to repeat. */
  async setDay(
    workspaceId: string,
    counterId: string,
    date: string,
    body: SetCounterDayBody,
    now = new Date(),
  ): Promise<Counter> {
    await this.change(workspaceId, counterId, now, async (tx, counter) => {
      const day = await this.markableDay(tx, counter, date, now);
      const dayEntries = (
        await tx
          .select()
          .from(counterOccurrences)
          .where(
            and(
              eq(counterOccurrences.counterId, counter.id),
              eq(counterOccurrences.localDate, date),
              ne(counterOccurrences.source, "system"),
            ),
          )
      ).map((row) => ({ ...row, date: row.localDate }));
      const plan = planDay({ target: day.target, dayEntries, change: body });
      if ("error" in plan) throw new BadRequestException(plan.error);
      if (plan.removeIds.length > 0) {
        await tx
          .delete(counterOccurrences)
          .where(inArray(counterOccurrences.id, plan.removeIds));
      }
      if (plan.add.length > 0) {
        await tx.insert(counterOccurrences).values(
          plan.add.map((status) => ({
            id: randomUUID(),
            counterId: counter.id,
            localDate: date,
            status,
            skipReason: body.status === "skipped" ? body.skipReason : null,
            source: "manual" as const,
            createdAt: now,
          })),
        );
      }
      if (day.isSaved) await saveDay(tx, counter.id, day, now);
    });
    return this.summary(workspaceId, counterId, now);
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
      if (occurrence.source === "system") {
        throw new BadRequestException(
          "A default fail cannot be removed; mark the day instead",
        );
      }
      const day = await this.markableDay(
        tx,
        counter,
        occurrence.localDate,
        now,
      );
      await tx
        .delete(counterOccurrences)
        .where(eq(counterOccurrences.id, occurrence.id));
      if (day.isSaved) await saveDay(tx, counter.id, day, now);
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
      .select({
        id: tasks.id,
        seriesId: tasks.seriesId,
        spaceId: tasks.spaceId,
      })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)));
    if (!task) throw new NotFoundException("Task not found");
    const spaceIds = await this.spaceIdsOf(this.db, counterId);
    if (!spaceIds.includes(task.spaceId)) {
      throw new BadRequestException("Link the Task's space first");
    }
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

  /** Locks the Counter, closes ended days, then applies one write. */
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
      if (counter) await closeEndedDays(tx, counter, now);
    });
    await this.db.transaction(async (tx) => {
      const counter = await lockCounter(tx, counterId);
      if (!counter) throw new NotFoundException("Counter not found");
      await write(tx, await closeEndedDays(tx, counter, now));
    });
  }

  /** The day behind `date`, if it may still be marked. */
  private async markableDay(
    tx: NodePgDatabase,
    counter: CounterRow,
    date: string,
    now: Date,
  ) {
    if (counter.status !== "active") {
      throw new BadRequestException("Restore the Counter to mark it");
    }
    const days = await this.daysOf(tx, counter.id);
    const today = localDate(now, counter.timeZone);
    const target = targetResolver(counter, days, today)(date);
    if (target === null || date > today) {
      throw new BadRequestException(
        "Only scheduled days up to today can be marked",
      );
    }
    const saved = days.find((day) => day.localDate === date);
    return {
      date,
      target,
      required: saved?.required ?? false,
      // Open days are saved when they close; any other mark is saved now.
      isSaved: saved !== undefined || date <= counter.closedThrough,
    };
  }

  private daysOf(db: NodePgDatabase, counterId: string) {
    return db
      .select()
      .from(counterDays)
      .where(eq(counterDays.counterId, counterId));
  }

  /** Applies a new set of linked spaces and returns the set now in force. */
  private async linkSpaces(
    tx: NodePgDatabase,
    counter: CounterRow,
    requested: string[] | undefined,
    now: Date,
  ): Promise<string[]> {
    const current = await this.spaceIdsOf(tx, counter.id);
    if (!requested) return current;
    const removed = current.filter((id) => !requested.includes(id));
    const added = requested.filter((id) => !current.includes(id));
    if (removed.length > 0) {
      await dropLinksInSpaces(tx, counter.workspaceId, counter.id, removed);
      await tx
        .delete(counterSpaces)
        .where(
          and(
            eq(counterSpaces.counterId, counter.id),
            inArray(counterSpaces.spaceId, removed),
          ),
        );
    }
    if (added.length > 0) {
      await tx.insert(counterSpaces).values(
        added.map((spaceId) => ({
          counterId: counter.id,
          spaceId,
          createdAt: now,
        })),
      );
    }
    return requested;
  }

  private async spaceIdsOf(db: NodePgDatabase, counterId: string) {
    const rows = await this.spaceRows(db, [counterId]);
    return rows.map((row) => row.spaceId);
  }

  private spaceRows(db: NodePgDatabase, counterIds: string[]) {
    return db
      .select()
      .from(counterSpaces)
      .where(inArray(counterSpaces.counterId, counterIds))
      .orderBy(asc(counterSpaces.createdAt), asc(counterSpaces.spaceId));
  }

  private async requireSection(
    workspaceId: string,
    sectionId: string | null | undefined,
  ) {
    if (!sectionId) return;
    const [section] = await this.db
      .select({ id: counterSections.id })
      .from(counterSections)
      .where(
        and(
          eq(counterSections.id, sectionId),
          eq(counterSections.workspaceId, workspaceId),
        ),
      );
    if (!section) throw new NotFoundException("Section not found");
  }

  private async requireSpaces(workspaceId: string, spaceIds: string[]) {
    if (spaceIds.length === 0) return;
    const found = await this.db
      .select({ id: spaces.id })
      .from(spaces)
      .where(
        and(inArray(spaces.id, spaceIds), eq(spaces.workspaceId, workspaceId)),
      );
    if (found.length !== spaceIds.length) {
      throw new NotFoundException("Space not found");
    }
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

  private async summaries(
    rows: CounterRow[],
    now: Date,
    until?: string,
  ): Promise<Counter[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);
    // Totals and streaks need the whole history.
    const [occurrences, days, linkedSpaces] = await Promise.all([
      this.occurrenceRows(inArray(counterOccurrences.counterId, ids)),
      this.db
        .select()
        .from(counterDays)
        .where(inArray(counterDays.counterId, ids)),
      this.spaceRows(this.db, ids),
    ]);
    return rows.map((row) =>
      toCounter({
        counter: row,
        occurrences: occurrences
          .filter((occurrence) => occurrence.counterId === row.id)
          .map((occurrence) => toCounterOccurrence(row, occurrence)),
        days: days.filter((day) => day.counterId === row.id),
        spaceIds: linkedSpaces
          .filter((linked) => linked.counterId === row.id)
          .map((linked) => linked.spaceId),
        until,
        now,
      }),
    );
  }

  private async detail(
    workspaceId: string,
    counterId: string,
    now: Date,
    until?: string,
  ): Promise<CounterDetail> {
    const row = await this.requireCounter(this.db, workspaceId, counterId);
    const [occurrences, days, spaceIds, links] = await Promise.all([
      this.occurrenceRows(eq(counterOccurrences.counterId, row.id)),
      this.daysOf(this.db, row.id),
      this.spaceIdsOf(this.db, row.id),
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
        days,
        spaceIds,
        until,
        now,
      }),
      history,
      links: await this.describeLinks(workspaceId, links, spaceIds),
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

  /** Picked Tasks, leaving out any that moved to a space no longer linked. */
  private async describeLinks(
    workspaceId: string,
    links: CounterLinkRow[],
    spaceIds: string[],
  ): Promise<CounterLink[]> {
    const resolved = await resolveLinks(this.db, workspaceId, links);
    return resolved.flatMap(({ link, task }) => {
      if (!task || !spaceIds.includes(task.spaceId)) return [];
      return {
        id: link.id,
        kind: link.seriesId ? ("series" as const) : ("task" as const),
        taskId: link.taskId,
        seriesId: link.seriesId,
        title: task.summary,
        taskKey: task.taskKey,
      };
    });
  }
}

/**
 * A new schedule or target waits until tomorrow while today is still open.
 * Otherwise nothing is in progress and it applies at once.
 */
function withRuleChange(
  counter: CounterRow,
  body: UpdateCounterBody,
  now: Date,
): CounterRow {
  if (body.schedule === undefined && body.target === undefined) return counter;
  const base = counter.pendingChange ?? counter;
  const requested = {
    schedule: body.schedule ?? base.schedule,
    target: body.target ?? base.target,
  };
  const unchanged =
    isSameSchedule(requested.schedule, counter.schedule) &&
    requested.target === counter.target;
  if (unchanged) return { ...counter, pendingChange: null };
  const today = localDate(now, counter.timeZone);
  const isTodayOpen =
    counter.status === "active" &&
    counter.closedThrough < today &&
    isScheduled(counter.schedule, counter.anchorDate, today);
  if (isTodayOpen) return { ...counter, pendingChange: requested };
  return applyRule(counter, requested, today);
}

function laterDate(left: string, right: string): string {
  return left > right ? left : right;
}
