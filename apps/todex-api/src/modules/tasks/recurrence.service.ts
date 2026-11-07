import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { and, asc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  addCalendarDays,
  defaultTaskRecurrence,
  DocType,
  expandRecurrenceStarts,
  formatOccurrenceLocalKey,
  occurrenceKey,
  readTaskRecurrence,
  TaskPriority,
  TaskStatus,
  zonedLocalDateTime,
} from "@repo/api/todex";
import type {
  CreateTaskReferenceBody,
  SeriesPatch,
  SeriesTemplate,
  TaskRecurrence,
  UpdateSeriesBody,
} from "@repo/api/todex";

import { DRIZZLE_DB } from "../../db/tokens";
import {
  docs,
  docTasks,
  executionSessionTasks,
  recurringSeries,
  seriesExceptions,
  seriesTemplateVersions,
  taskReferences,
  taskScheduleSlots,
  tasks,
  workspaces,
  type TaskRow,
} from "../../db/schema";
import { formatTaskKey } from "../../helpers/parent-cycle.helper";
import { satisfiedPrefix, unsatisfiedDue, type DueCandidate } from "./series-cursor";

const INSERT_LIMIT = 30;
const PREVIEW_DAYS = 30;

@Injectable()
export class RecurrenceService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async materializeDue(workspaceId?: string): Promise<void> {
    const rows = await this.db
      .select()
      .from(recurringSeries)
      .where(
        and(
          isNull(recurringSeries.stoppedAt),
          ...(workspaceId ? [eq(recurringSeries.workspaceId, workspaceId)] : []),
        ),
      );
    for (const series of rows) {
      await this.materializeSeries(series.id);
    }
  }

  async previews(workspaceId: string, from: Date, to: Date) {
    const now = new Date();
    const horizon = addCalendarDays(now, PREVIEW_DAYS, "UTC");
    const windowStart = from > now ? from : now;
    const windowEnd = to < horizon ? to : horizon;
    if (!(windowStart < windowEnd)) return [];
    const seriesRows = await this.db
      .select()
      .from(recurringSeries)
      .where(
        and(
          eq(recurringSeries.workspaceId, workspaceId),
          isNull(recurringSeries.stoppedAt),
        ),
      );
    const previews = [];
    for (const series of seriesRows) {
      const rule = readTaskRecurrence(series.rule);
      if (!rule || series.ruleEffectiveAt > now) continue;
      const versions = await this.versions(series.id);
      const instances = await this.db
        .select({
          occurrenceKey: tasks.occurrenceKey,
          occurrenceAnchor: tasks.occurrenceAnchor,
        })
        .from(tasks)
        .where(eq(tasks.seriesId, series.id));
      const exceptions = await this.db
        .select({ occurrenceKey: seriesExceptions.occurrenceKey })
        .from(seriesExceptions)
        .where(eq(seriesExceptions.seriesId, series.id));
      const exceptionKeys = new Set(exceptions.map((row) => row.occurrenceKey));
      const anchors = new Set(
        instances
          .filter((row) => row.occurrenceAnchor)
          .map((row) => row.occurrenceAnchor!.getTime()),
      );
      const starts = expandRecurrenceStarts({
        start: series.anchor,
        rule,
        rangeStart: windowStart,
        rangeEnd: windowEnd,
        limit: 40,
      }).filter((start) => start >= series.ruleEffectiveAt && start > now);
      for (const start of starts) {
        const key = occurrenceKey(series.ruleVersion, start, rule.timeZone);
        if (exceptionKeys.has(key) || anchors.has(start.getTime())) continue;
        const template = templateAt(versions, start);
        if (!template) continue;
        previews.push({
          seriesId: series.id,
          occurrenceKey: key,
          title: template.summary,
          slots: absoluteSlots(start, template, rule.timeZone).map((slot) => ({
            startAt: slot.startAt.toISOString(),
            endAt: slot.endAt.toISOString(),
          })),
        });
      }
    }
    return previews;
  }

  async createSeries(workspaceId: string, taskId: string, anchor: Date) {
    return this.db.transaction(async (tx) => {
      const task = await this.requireTask(tx, workspaceId, taskId);
      if (task.parentTaskId) {
        throw new BadRequestException("Only root tasks can repeat");
      }
      if (task.seriesId) {
        throw new ConflictException("Task is already in a series");
      }
      const rule =
        readTaskRecurrence(task.recurrence) ??
        defaultTaskRecurrence({
          scheduleDate: anchor.toISOString(),
          dueDate: null,
          timeZone: "UTC",
          now: anchor,
        });
      const now = new Date();
      const seriesId = randomUUID();
      await tx.insert(recurringSeries).values({
        id: seriesId,
        workspaceId,
        anchor,
        rule,
        ruleVersion: 1,
        stoppedAt: null,
        ruleEffectiveAt: anchor,
        cursorRuleVersion: 1,
        generatedThrough: null,
        createdAt: now,
        updatedAt: now,
      });
      const template = await this.templateFromTask(tx, task, anchor, rule.timeZone);
      await tx.insert(seriesTemplateVersions).values({
        id: randomUUID(),
        seriesId,
        effectiveAt: anchor,
        template,
      });
      await tx
        .update(tasks)
        .set({
          seriesId,
          occurrenceKey: occurrenceKey(1, anchor, rule.timeZone),
          occurrenceAnchor: anchor,
          originSeriesId: seriesId,
          overriddenFields: [],
          version: sql`${tasks.version} + 1`,
          updatedAt: now,
        })
        .where(eq(tasks.id, task.id));
      return seriesId;
    });
  }

  async updateSeries(
    workspaceId: string,
    taskId: string,
    body: UpdateSeriesBody,
  ) {
    return this.db.transaction(async (tx) => {
      const task = await this.requireTask(tx, workspaceId, taskId);
      if (!task.seriesId || !task.occurrenceAnchor) {
        throw new BadRequestException("Task is not a series instance");
      }
      if (body.patch.rule || body.patch.anchor || body.patch.ruleEffectiveAt) {
        await this.applyRuleChange(tx, task.seriesId, body.patch);
      }
      if (body.scope === "instance") {
        await this.patchInstance(tx, task, body.patch);
        return;
      }
      const versions = await this.versions(task.seriesId, tx);
      const current = templateAt(versions, task.occurrenceAnchor);
      if (!current) throw new ForbiddenException();
      const next = applyPatch(current, body.patch);
      await tx.insert(seriesTemplateVersions).values({
        id: randomUUID(),
        seriesId: task.seriesId,
        effectiveAt: task.occurrenceAnchor,
        template: next,
      });
      await this.patchFutureInstances(tx, task, body.patch);
    });
  }

  async addException(
    workspaceId: string,
    seriesId: string,
    occurrenceKeyValue: string,
    kind: "skipped" | "deleted",
  ) {
    const series = await this.requireSeries(this.db, workspaceId, seriesId);
    const rule = readTaskRecurrence(series.rule);
    if (!rule) throw new BadRequestException("Series rule is invalid");
    const anchor = anchorFromKey(occurrenceKeyValue, rule);
    if (anchor) {
      const [existing] = await this.db
        .select({ id: tasks.id })
        .from(tasks)
        .where(
          and(
            eq(tasks.seriesId, seriesId),
            eq(tasks.occurrenceAnchor, anchor),
          ),
        )
        .limit(1);
      if (existing) {
        throw new ConflictException("That occurrence is already a task");
      }
    }
    await this.db
      .insert(seriesExceptions)
      .values({
        id: randomUUID(),
        seriesId,
        occurrenceKey: occurrenceKeyValue,
        kind,
      })
      .onConflictDoNothing();
  }

  async stop(workspaceId: string, seriesId: string, openTaskId?: string) {
    const now = new Date();
    await this.db.transaction(async (tx) => {
      const series = await this.requireSeries(tx, workspaceId, seriesId);
      await tx
        .update(recurringSeries)
        .set({ stoppedAt: now, updatedAt: now })
        .where(eq(recurringSeries.id, series.id));
      const instances = await tx
        .select()
        .from(tasks)
        .where(eq(tasks.seriesId, series.id));
      for (const instance of instances) {
        if (instance.id === openTaskId) continue;
        if (instance.status !== TaskStatus.TODO) continue;
        if (!instance.occurrenceAnchor || instance.occurrenceAnchor <= now) {
          continue;
        }
        const sessions = await tx
          .select({ id: executionSessionTasks.id })
          .from(executionSessionTasks)
          .where(eq(executionSessionTasks.taskId, instance.id))
          .limit(1);
        if (sessions.length > 0) continue;
        await tx
          .update(tasks)
          .set({
            status: TaskStatus.CANCELLED,
            version: sql`${tasks.version} + 1`,
            updatedAt: now,
          })
          .where(eq(tasks.id, instance.id));
      }
    });
  }

  async deleteSeries(workspaceId: string, seriesId: string) {
    return this.db.transaction(async (tx) => {
      const series = await this.requireSeries(tx, workspaceId, seriesId);
      const instances = await tx
        .select({ id: tasks.id, originSeriesId: tasks.originSeriesId })
        .from(tasks)
        .where(eq(tasks.seriesId, series.id));
      for (const instance of instances) {
        await tx
          .update(tasks)
          .set({
            originSeriesId: instance.originSeriesId || series.id,
            seriesId: null,
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, instance.id));
      }
      await tx
        .delete(seriesExceptions)
        .where(eq(seriesExceptions.seriesId, series.id));
      await tx
        .delete(seriesTemplateVersions)
        .where(eq(seriesTemplateVersions.seriesId, series.id));
      await tx.delete(recurringSeries).where(eq(recurringSeries.id, series.id));
      return { kept: instances.length };
    });
  }

  async seriesCountForSpace(workspaceId: string, spaceId: string) {
    const rows = await this.db
      .select()
      .from(recurringSeries)
      .where(eq(recurringSeries.workspaceId, workspaceId));
    let count = 0;
    for (const series of rows) {
      const versions = await this.versions(series.id);
      const latest = [...versions].sort(
        (left, right) => right.effectiveAt.getTime() - left.effectiveAt.getTime(),
      )[0];
      if (latest?.template.spaceId === spaceId) count += 1;
    }
    return count;
  }

  async deleteSeriesInSpace(workspaceId: string, spaceId: string) {
    const rows = await this.db
      .select({ id: recurringSeries.id })
      .from(recurringSeries)
      .where(eq(recurringSeries.workspaceId, workspaceId));
    for (const row of rows) {
      const versions = await this.versions(row.id);
      const latest = [...versions].sort(
        (left, right) => right.effectiveAt.getTime() - left.effectiveAt.getTime(),
      )[0];
      if (latest?.template.spaceId === spaceId) {
        await this.deleteSeries(workspaceId, row.id);
      }
    }
  }

  async clearEpic(workspaceId: string, epicId: string) {
    const rows = await this.db
      .select({
        id: seriesTemplateVersions.id,
        template: seriesTemplateVersions.template,
        workspaceId: recurringSeries.workspaceId,
      })
      .from(seriesTemplateVersions)
      .innerJoin(
        recurringSeries,
        eq(recurringSeries.id, seriesTemplateVersions.seriesId),
      )
      .where(eq(recurringSeries.workspaceId, workspaceId));
    for (const row of rows) {
      const template = clearEpicId(row.template, epicId);
      if (template === row.template) continue;
      await this.db
        .update(seriesTemplateVersions)
        .set({ template })
        .where(eq(seriesTemplateVersions.id, row.id));
    }
  }

  private async materializeSeries(seriesId: string) {
    await this.db.transaction(async (tx) => {
      const [series] = await tx
        .select()
        .from(recurringSeries)
        .where(eq(recurringSeries.id, seriesId))
        .limit(1);
      if (!series || series.stoppedAt) return;
      const now = new Date();
      if (series.ruleEffectiveAt > now) return;
      const rule = readTaskRecurrence(series.rule);
      if (!rule) return;
      if (series.cursorRuleVersion !== series.ruleVersion) return;
      const starts = expandRecurrenceStarts({
        start: series.anchor,
        rule,
        rangeStart: series.anchor,
        rangeEnd: new Date(now.getTime() + 1),
      }).filter(
        (start) => start >= series.ruleEffectiveAt && start.getTime() <= now.getTime(),
      );
      const candidates: DueCandidate[] = starts.map((anchor) => ({
        anchor,
        localKey: formatOccurrenceLocalKey(anchor, rule.timeZone),
      }));
      const instances = await tx
        .select({
          occurrenceKey: tasks.occurrenceKey,
          occurrenceAnchor: tasks.occurrenceAnchor,
        })
        .from(tasks)
        .where(eq(tasks.seriesId, series.id));
      const exceptions = await tx
        .select({ occurrenceKey: seriesExceptions.occurrenceKey })
        .from(seriesExceptions)
        .where(eq(seriesExceptions.seriesId, series.id));
      const keys = new Set(
        [
          ...instances.map((row) => row.occurrenceKey),
          ...exceptions.map((row) => row.occurrenceKey),
        ].filter((key): key is string => Boolean(key)),
      );
      const anchors = new Set(
        instances
          .filter((row) => row.occurrenceAnchor)
          .map((row) => row.occurrenceAnchor!.getTime()),
      );
      const versionKey = (localKey: string) =>
        `${series.ruleVersion}/${localKey}`;
      const isSatisfied = (candidate: DueCandidate) =>
        keys.has(versionKey(candidate.localKey)) ||
        anchors.has(candidate.anchor.getTime());
      const pending = unsatisfiedDue(candidates, isSatisfied, INSERT_LIMIT);
      const versions = await this.versions(series.id, tx);
      for (const candidate of pending) {
        const template = templateAt(versions, candidate.anchor);
        if (!template) continue;
        const inserted = await this.insertInstance(tx, {
          series,
          rule,
          anchor: candidate.anchor,
          template,
        });
        if (inserted) {
          keys.add(versionKey(candidate.localKey));
          anchors.add(candidate.anchor.getTime());
        }
      }
      const through = satisfiedPrefix(candidates, (candidate) =>
        keys.has(versionKey(candidate.localKey)) ||
        anchors.has(candidate.anchor.getTime()),
      );
      if (through === series.generatedThrough) return;
      const updated = await tx
        .update(recurringSeries)
        .set({
          generatedThrough: through,
          cursorRuleVersion: series.ruleVersion,
          updatedAt: now,
        })
        .where(
          and(
            eq(recurringSeries.id, series.id),
            eq(recurringSeries.cursorRuleVersion, series.ruleVersion),
            series.generatedThrough == null
              ? isNull(recurringSeries.generatedThrough)
              : eq(recurringSeries.generatedThrough, series.generatedThrough),
          ),
        )
        .returning({ id: recurringSeries.id });
      if (updated.length === 0) {
        throw new ConflictException("cursor_rule_version changed");
      }
    });
  }

  private async insertInstance(
    tx: NodePgDatabase,
    input: {
      series: typeof recurringSeries.$inferSelect;
      rule: TaskRecurrence;
      anchor: Date;
      template: SeriesTemplate;
    },
  ) {
    const key = occurrenceKey(
      input.series.ruleVersion,
      input.anchor,
      input.rule.timeZone,
    );
    const [workspace] = await tx
      .update(workspaces)
      .set({
        taskSeq: sql`${workspaces.taskSeq} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, input.series.workspaceId))
      .returning();
    if (!workspace) return false;
    const now = new Date();
    const taskId = randomUUID();
    const inserted = await tx
      .insert(tasks)
      .values({
        ...taskValues(input.template, {
          id: taskId,
          workspaceId: input.series.workspaceId,
          taskKey: formatTaskKey(workspace.taskSeq),
          parentTaskId: null,
          seriesId: input.series.id,
          occurrenceKey: key,
          occurrenceAnchor: input.anchor,
          originSeriesId: input.series.id,
          dueDate: dueFromOffset(
            input.anchor,
            input.template.dueOffset,
            input.rule.timeZone,
          ),
          now,
        }),
      })
      .onConflictDoNothing()
      .returning({ id: tasks.id });
    if (inserted.length === 0) return false;
    await this.writeGeneratedParts(tx, {
      workspaceId: input.series.workspaceId,
      taskId,
      template: input.template,
      anchor: input.anchor,
      timeZone: input.rule.timeZone,
      now,
    });
    let sequence = workspace.taskSeq;
    for (const subtask of input.template.subtasks) {
      sequence += 1;
      await tx
        .update(workspaces)
        .set({ taskSeq: sequence, updatedAt: now })
        .where(eq(workspaces.id, input.series.workspaceId));
      const subtaskId = randomUUID();
      await tx.insert(tasks).values({
        ...taskValues(subtask, {
          id: subtaskId,
          workspaceId: input.series.workspaceId,
          taskKey: formatTaskKey(sequence),
          parentTaskId: taskId,
          seriesId: null,
          occurrenceKey: null,
          occurrenceAnchor: null,
          originSeriesId: null,
          dueDate: dueFromOffset(input.anchor, subtask.dueOffset, input.rule.timeZone),
          now,
        }),
      });
      await this.writeGeneratedParts(tx, {
        workspaceId: input.series.workspaceId,
        taskId: subtaskId,
        template: subtask,
        anchor: input.anchor,
        timeZone: input.rule.timeZone,
        now,
      });
    }
    return true;
  }

  private async writeGeneratedParts(
    tx: NodePgDatabase,
    input: {
      workspaceId: string;
      taskId: string;
      template: SeriesTemplate;
      anchor: Date;
      timeZone: string;
      now: Date;
    },
  ) {
    const slots = absoluteSlots(input.anchor, input.template, input.timeZone);
    if (slots.length > 0) {
      await tx.insert(taskScheduleSlots).values(
        slots.map((slot) => ({
          id: randomUUID(),
          workspaceId: input.workspaceId,
          taskId: input.taskId,
          startAt: slot.startAt,
          endAt: slot.endAt,
          retiredAt: null,
        })),
      );
    }
    if (input.template.goalId) {
      await tx.insert(docTasks).values({
        docId: input.template.goalId,
        taskId: input.taskId,
      });
    }
    if (input.template.references.length > 0) {
      await tx.insert(taskReferences).values(
        input.template.references.map((reference) =>
          referenceRow(input.workspaceId, input.taskId, reference, input.now),
        ),
      );
    }
  }

  private async applyRuleChange(
    tx: NodePgDatabase,
    seriesId: string,
    patch: SeriesPatch,
  ) {
    if (patch.ruleEffectiveAt && new Date(patch.ruleEffectiveAt) > new Date()) {
      throw new BadRequestException("Rule changes apply immediately");
    }
    const [series] = await tx
      .select()
      .from(recurringSeries)
      .where(eq(recurringSeries.id, seriesId))
      .limit(1);
    if (!series) throw new ForbiddenException();
    const rule = patch.rule ?? readTaskRecurrence(series.rule);
    if (!rule) throw new BadRequestException("Series rule is invalid");
    const now = new Date();
    await tx
      .update(recurringSeries)
      .set({
        rule,
        anchor: patch.anchor ? new Date(patch.anchor) : series.anchor,
        ruleVersion: series.ruleVersion + 1,
        ruleEffectiveAt: now,
        cursorRuleVersion: series.ruleVersion + 1,
        generatedThrough: null,
        updatedAt: now,
      })
      .where(eq(recurringSeries.id, series.id));
  }

  private async patchInstance(
    tx: NodePgDatabase,
    task: TaskRow,
    patch: SeriesPatch,
  ) {
    const names = overriddenNames(patch);
    const current = task.overriddenFields ?? [];
    await tx
      .update(tasks)
      .set({
        ...scalarPatch(patch),
        overriddenFields: [...new Set([...current, ...names])],
        version: sql`${tasks.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));
  }

  private async patchFutureInstances(
    tx: NodePgDatabase,
    task: TaskRow,
    patch: SeriesPatch,
  ) {
    if (!task.seriesId || !task.occurrenceAnchor) return;
    const instances = await tx
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.seriesId, task.seriesId),
          gte(tasks.occurrenceAnchor, task.occurrenceAnchor),
          eq(tasks.status, TaskStatus.TODO),
        ),
      );
    for (const instance of instances) {
      const open = await tx
        .select({ intervals: executionSessionTasks.intervals })
        .from(executionSessionTasks)
        .where(eq(executionSessionTasks.taskId, instance.id));
      if (
        open.some((link) =>
          (link.intervals ?? []).some((interval) => interval.endedAt == null),
        )
      ) {
        continue;
      }
      const blocked = new Set(instance.overriddenFields ?? []);
      const scalars = scalarPatch(patch, blocked);
      await tx
        .update(tasks)
        .set({
          ...scalars,
          ...(patch.acceptanceCriteria && !blocked.has("acceptanceCriteria")
            ? {
                acceptanceCriteria: patch.acceptanceCriteria.map((criterion) => ({
                  ...criterion,
                  done: false,
                })),
              }
            : {}),
          version: sql`${tasks.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, instance.id));
    }
  }

  private async templateFromTask(
    tx: NodePgDatabase,
    task: TaskRow,
    anchor: Date,
    timeZone: string,
  ): Promise<SeriesTemplate> {
    const slots = await tx
      .select()
      .from(taskScheduleSlots)
      .where(eq(taskScheduleSlots.taskId, task.id));
    const children = await tx
      .select()
      .from(tasks)
      .where(eq(tasks.parentTaskId, task.id))
      .orderBy(asc(tasks.position), asc(tasks.createdAt));
    const references = await tx
      .select()
      .from(taskReferences)
      .where(eq(taskReferences.taskId, task.id));
    const [goal] = await tx
      .select({ docId: docTasks.docId })
      .from(docTasks)
      .innerJoin(docs, eq(docs.id, docTasks.docId))
      .where(and(eq(docTasks.taskId, task.id), eq(docs.type, DocType.GOAL)))
      .limit(1);
    const subtasks: SeriesTemplate[] = [];
    for (const child of children) {
      subtasks.push(
        await this.templateFromTask(tx, child, anchor, timeZone).then((template) => ({
          ...template,
          subtasks: [],
        })),
      );
    }
    return {
      summary: task.summary,
      outcome: task.outcome,
      description: task.description,
      estimation: task.estimation,
      priority: task.priority,
      complexity: task.complexity,
      progressStageId: task.progressStageId,
      spaceId: task.spaceId,
      sectionId: task.sectionId,
      epicId: task.epicId,
      goalId: goal?.docId ?? null,
      ownerId: task.ownerId,
      acceptanceCriteria: (task.acceptanceCriteria ?? []).map((criterion) => ({
        ...criterion,
        done: false,
      })),
      references: references.map(referenceInput),
      subtasks,
      slotOffsets: slots.map((slot) =>
        offsetFromSlot(anchor, slot.startAt, slot.endAt, timeZone),
      ),
      dueOffset: task.dueDate
        ? dayOffset(anchor, task.dueDate, timeZone)
        : null,
    };
  }

  private async versions(seriesId: string, tx: NodePgDatabase = this.db) {
    return tx
      .select()
      .from(seriesTemplateVersions)
      .where(eq(seriesTemplateVersions.seriesId, seriesId))
      .orderBy(asc(seriesTemplateVersions.effectiveAt));
  }

  private async requireSeries(
    tx: NodePgDatabase,
    workspaceId: string,
    seriesId: string,
  ) {
    const [series] = await tx
      .select()
      .from(recurringSeries)
      .where(eq(recurringSeries.id, seriesId))
      .limit(1);
    if (!series || series.workspaceId !== workspaceId) {
      throw new ForbiddenException();
    }
    return series;
  }

  private async requireTask(
    tx: NodePgDatabase,
    workspaceId: string,
    taskId: string,
  ) {
    const [task] = await tx
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    if (!task || task.workspaceId !== workspaceId) throw new ForbiddenException();
    return task;
  }
}

function templateAt(
  versions: Array<{ effectiveAt: Date; template: SeriesTemplate }>,
  anchor: Date,
): SeriesTemplate | null {
  let match: SeriesTemplate | null = null;
  for (const version of versions) {
    if (version.effectiveAt <= anchor) match = version.template;
  }
  return match;
}

function absoluteSlots(
  anchor: Date,
  template: SeriesTemplate,
  timeZone: string,
) {
  const anchorDate = formatOccurrenceLocalKey(anchor, timeZone).slice(0, 10);
  return template.slotOffsets.map((offset) => {
    const day = addCalendarDays(
      zonedLocalDateTime(anchorDate, "00:00", timeZone),
      offset.dayOffset,
      timeZone,
    );
    const date = formatOccurrenceLocalKey(day, timeZone).slice(0, 10);
    let end = zonedLocalDateTime(date, offset.endLocal, timeZone);
    const start = zonedLocalDateTime(date, offset.startLocal, timeZone);
    if (end <= start) end = addCalendarDays(end, 1, timeZone);
    return { startAt: start, endAt: end };
  });
}

function dueFromOffset(
  anchor: Date,
  dueOffset: number | null,
  timeZone: string,
): Date | null {
  if (dueOffset == null) return null;
  return addCalendarDays(anchor, dueOffset, timeZone);
}

function taskValues(
  template: SeriesTemplate,
  input: {
    id: string;
    workspaceId: string;
    taskKey: string;
    parentTaskId: string | null;
    seriesId: string | null;
    occurrenceKey: string | null;
    occurrenceAnchor: Date | null;
    originSeriesId: string | null;
    dueDate: Date | null;
    now: Date;
  },
) {
  return {
    id: input.id,
    workspaceId: input.workspaceId,
    spaceId: template.spaceId,
    taskKey: input.taskKey,
    summary: template.summary,
    description: template.description,
    outcome: template.outcome,
    status: TaskStatus.TODO,
    priority: template.priority ?? TaskPriority.MEDIUM,
    complexity: template.complexity,
    dueDate: input.dueDate,
    estimation: template.estimation,
    acceptanceCriteria: template.acceptanceCriteria.map((criterion) => ({
      ...criterion,
      done: false,
    })),
    recurrence: null,
    sectionId: template.sectionId,
    progressStageId: template.progressStageId,
    epicId: template.epicId,
    parentTaskId: input.parentTaskId,
    ownerId: template.ownerId,
    seriesId: input.seriesId,
    occurrenceKey: input.occurrenceKey,
    occurrenceAnchor: input.occurrenceAnchor,
    originSeriesId: input.originSeriesId,
    overriddenFields: [],
    version: 1,
    position: 0,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

function referenceRow(
  workspaceId: string,
  taskId: string,
  reference: CreateTaskReferenceBody,
  now: Date,
) {
  if (reference.kind === "doc") {
    return {
      id: randomUUID(),
      workspaceId,
      taskId,
      kind: "doc",
      docId: reference.docId,
      conversationId: null,
      url: null,
      title: "Document",
      createdAt: now,
    };
  }
  if (reference.kind === "conversation") {
    return {
      id: randomUUID(),
      workspaceId,
      taskId,
      kind: "conversation",
      docId: null,
      conversationId: reference.conversationId,
      url: null,
      title: "Conversation",
      createdAt: now,
    };
  }
  return {
    id: randomUUID(),
    workspaceId,
    taskId,
    kind: "url",
    docId: null,
    conversationId: null,
    url: reference.url,
    title: reference.title ?? reference.url,
    createdAt: now,
  };
}

function referenceInput(
  row: typeof taskReferences.$inferSelect,
): CreateTaskReferenceBody {
  if (row.kind === "doc" && row.docId) return { kind: "doc", docId: row.docId };
  if (row.kind === "conversation" && row.conversationId) {
    return { kind: "conversation", conversationId: row.conversationId };
  }
  return { kind: "url", url: row.url ?? "https://example.com", title: row.title };
}

function offsetFromSlot(
  anchor: Date,
  startAt: Date,
  endAt: Date,
  timeZone: string,
) {
  return {
    dayOffset: dayOffset(anchor, startAt, timeZone),
    startLocal: formatOccurrenceLocalKey(startAt, timeZone).slice(11, 16),
    endLocal: formatOccurrenceLocalKey(endAt, timeZone).slice(11, 16),
  };
}

function dayOffset(anchor: Date, instant: Date, timeZone: string): number {
  const start = formatOccurrenceLocalKey(anchor, timeZone).slice(0, 10);
  const end = formatOccurrenceLocalKey(instant, timeZone).slice(0, 10);
  const startUtc = Date.parse(`${start}T00:00:00Z`);
  const endUtc = Date.parse(`${end}T00:00:00Z`);
  return Math.round((endUtc - startUtc) / 86_400_000);
}

function applyPatch(template: SeriesTemplate, patch: SeriesPatch): SeriesTemplate {
  return {
    ...template,
    ...(patch.summary !== undefined ? { summary: patch.summary } : {}),
    ...(patch.outcome !== undefined ? { outcome: patch.outcome } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.estimation !== undefined ? { estimation: patch.estimation } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.complexity !== undefined ? { complexity: patch.complexity } : {}),
    ...(patch.progressStageId !== undefined
      ? { progressStageId: patch.progressStageId }
      : {}),
    ...(patch.spaceId !== undefined ? { spaceId: patch.spaceId } : {}),
    ...(patch.sectionId !== undefined ? { sectionId: patch.sectionId } : {}),
    ...(patch.epicId !== undefined ? { epicId: patch.epicId } : {}),
    ...(patch.goalId !== undefined ? { goalId: patch.goalId } : {}),
    ...(patch.acceptanceCriteria !== undefined
      ? {
          acceptanceCriteria: patch.acceptanceCriteria.map((criterion) => ({
            ...criterion,
            done: false,
          })),
        }
      : {}),
    ...(patch.references !== undefined ? { references: patch.references } : {}),
    ...(patch.subtasks !== undefined ? { subtasks: patch.subtasks } : {}),
    ...(patch.slotOffsets !== undefined ? { slotOffsets: patch.slotOffsets } : {}),
    ...(patch.dueDate !== undefined
      ? { dueOffset: patch.dueDate == null ? null : template.dueOffset }
      : {}),
  };
}

function scalarPatch(patch: SeriesPatch, blocked?: Set<string>) {
  const allow = (name: string) => !blocked?.has(name);
  return {
    ...(patch.summary !== undefined && allow("summary")
      ? { summary: patch.summary }
      : {}),
    ...(patch.outcome !== undefined && allow("outcome")
      ? { outcome: patch.outcome }
      : {}),
    ...(patch.description !== undefined && allow("description")
      ? { description: patch.description }
      : {}),
    ...(patch.estimation !== undefined && allow("estimation")
      ? { estimation: patch.estimation }
      : {}),
    ...(patch.priority !== undefined && allow("priority")
      ? { priority: patch.priority }
      : {}),
    ...(patch.complexity !== undefined && allow("complexity")
      ? { complexity: patch.complexity }
      : {}),
    ...(patch.progressStageId !== undefined && allow("progressStageId")
      ? { progressStageId: patch.progressStageId }
      : {}),
    ...(patch.spaceId !== undefined && allow("spaceId")
      ? { spaceId: patch.spaceId }
      : {}),
    ...(patch.sectionId !== undefined && allow("sectionId")
      ? { sectionId: patch.sectionId }
      : {}),
    ...(patch.epicId !== undefined && allow("epicId")
      ? { epicId: patch.epicId }
      : {}),
    ...(patch.dueDate !== undefined && allow("dueDate")
      ? { dueDate: patch.dueDate ? new Date(patch.dueDate) : null }
      : {}),
  };
}

function overriddenNames(patch: SeriesPatch): string[] {
  const names: string[] = [];
  for (const key of [
    "summary",
    "outcome",
    "description",
    "estimation",
    "priority",
    "complexity",
    "progressStageId",
    "spaceId",
    "sectionId",
    "epicId",
    "goalId",
    "dueDate",
    "acceptanceCriteria",
    "references",
    "subtasks",
    "slotOffsets",
  ] as const) {
    if (patch[key] !== undefined) {
      names.push(key === "slotOffsets" ? "slots" : key);
    }
  }
  return names;
}

function clearEpicId(template: SeriesTemplate, epicId: string): SeriesTemplate {
  return {
    ...template,
    epicId: template.epicId === epicId ? null : template.epicId,
    subtasks: template.subtasks.map((subtask) => clearEpicId(subtask, epicId)),
  };
}

function anchorFromKey(key: string, rule: TaskRecurrence): Date | null {
  const local = key.split("/").slice(1).join("/");
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(local);
  if (!match || !match[1] || !match[2]) return null;
  return zonedLocalDateTime(match[1], match[2], rule.timeZone);
}
