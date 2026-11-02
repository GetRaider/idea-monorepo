import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Optional,
} from "@nestjs/common";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  DocMentionTarget,
  DocType,
  RelationEntityType,
  collectMentions,
  emptyCommonDocBody,
  emptyGoalDocBody,
  projectProse,
  readGoalDocBody,
  UpdateCommonDocBodySchema,
  UpdateGoalDocBodySchema,
} from "@repo/api/todex";
import type {
  CommonDocBody,
  CreateDocBody,
  DocBody,
  DocMentionRef,
  DocPlainText,
  GoalDocBody,
  ListDocsQuery,
  ProseDoc,
  UpdateCommonDocBody,
  UpdateDocBody,
  UpdateGoalDocBody,
} from "@repo/api/todex";

import { DRIZZLE_DB } from "../../db/tokens";
import {
  calendarEvents,
  docFolders,
  docs,
  docTasks,
  epics,
  spaces,
  tasks,
  workspaces,
} from "../../db/schema";
import type { DocRow } from "../../db/schema";
import { mapDoc, mapDocSummary } from "../../db/mappers";
import { planningProgress } from "../epics/progress";
import { ContentIndexQueue } from "../content-index/content-index.queue";
import { RelationsService } from "../relations/relations.service";
import { WorkspaceService } from "../workspace/workspace.service";

@Injectable()
export class DocsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly workspaceService: WorkspaceService,
    private readonly relations: RelationsService,
    @Optional() private readonly contentIndex?: ContentIndexQueue,
  ) {}

  async list(workspaceId: string, query: ListDocsQuery) {
    const filters = [eq(docs.workspaceId, workspaceId)];
    if (query.type) filters.push(eq(docs.type, query.type));
    if (query.spaceId) filters.push(eq(docs.spaceId, query.spaceId));
    if (query.folderId) filters.push(eq(docs.folderId, query.folderId));

    const rows = await this.db
      .select({
        id: docs.id,
        workspaceId: docs.workspaceId,
        spaceId: docs.spaceId,
        folderId: docs.folderId,
        type: docs.type,
        docKey: docs.docKey,
        title: docs.title,
        body: docs.body,
        createdAt: docs.createdAt,
        updatedAt: docs.updatedAt,
      })
      .from(docs)
      .where(and(...filters))
      .orderBy(desc(docs.updatedAt));
    const goalIds = rows.flatMap((row) =>
      row.type === DocType.GOAL ? [row.id] : [],
    );
    const progressByGoalId = await this.progressByGoal(goalIds);
    return rows.map((row) =>
      mapDocSummary(row, progressByGoalId.get(row.id) ?? null),
    );
  }

  async get(workspaceId: string, docId: string) {
    const row = await this.requireInWorkspace(workspaceId, docId);
    const linkedTaskIds =
      row.type === DocType.GOAL ? await this.linkedTaskIds(row.id) : [];
    return mapDoc(row, linkedTaskIds);
  }

  async create(workspaceId: string, body: CreateDocBody) {
    await this.requireSpace(workspaceId, body.spaceId);
    const folderId = body.folderId ?? null;
    if (folderId) {
      await this.requireDocsFolder(workspaceId, folderId, body.spaceId);
    }

    const linkedTaskIds =
      body.type === DocType.GOAL ? (body.linkedTaskIds ?? []) : [];
    await this.requireTasks(workspaceId, linkedTaskIds);

    const docId = randomUUID();
    const stored = await this.projectBody(
      workspaceId,
      docId,
      body.type === DocType.COMMON
        ? (body.body ?? emptyCommonDocBody())
        : (body.body ?? emptyGoalDocBody()),
    );
    const now = new Date();

    await this.db.transaction(async (tx) => {
      const [workspace] = await tx
        .update(workspaces)
        .set({
          docSeq: sql`${workspaces.docSeq} + 1`,
          updatedAt: now,
        })
        .where(eq(workspaces.id, workspaceId))
        .returning();
      if (!workspace) throw new ForbiddenException();

      await tx.insert(docs).values({
        id: docId,
        workspaceId,
        spaceId: body.spaceId,
        folderId,
        type: body.type,
        docKey: formatDocKey(workspace.docSeq),
        title: body.title,
        body: stored.body,
        plainText: stored.plainText,
        createdAt: now,
        updatedAt: now,
      });
      await this.writeMentions(tx, docId, stored.mentions);
      if (body.type === DocType.GOAL) {
        await this.writeLinkedTasks(tx, docId, linkedTaskIds);
      }
    });

    await this.workspaceService.bumpUpdatedAt(workspaceId);
    await this.scheduleIndex(workspaceId, docId);
    return this.get(workspaceId, docId);
  }

  async update(workspaceId: string, docId: string, body: UpdateDocBody) {
    const existing = await this.requireInWorkspace(workspaceId, docId);
    if (existing.type === DocType.COMMON && body.linkedTaskIds) {
      throw new BadRequestException("Common docs cannot link tasks");
    }

    const nextSpaceId = body.spaceId ?? existing.spaceId;
    if (body.spaceId) await this.requireSpace(workspaceId, body.spaceId);
    const folderId = await this.folderForMove(existing, body, nextSpaceId);
    if (folderId) {
      await this.requireDocsFolder(workspaceId, folderId, nextSpaceId);
    }
    if (body.linkedTaskIds) {
      await this.requireTasks(workspaceId, body.linkedTaskIds);
    }

    const nextBody = this.mergeBody(existing, body.body);
    const stored = nextBody
      ? await this.projectBody(workspaceId, existing.id, nextBody)
      : null;

    await this.db.transaction(async (tx) => {
      await tx
        .update(docs)
        .set({
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.spaceId !== undefined ? { spaceId: body.spaceId } : {}),
          ...(folderId !== existing.folderId || body.folderId !== undefined
            ? { folderId }
            : {}),
          ...(stored ? { body: stored.body, plainText: stored.plainText } : {}),
          updatedAt: new Date(),
        })
        .where(eq(docs.id, existing.id));
      if (stored) await this.writeMentions(tx, existing.id, stored.mentions);
      if (body.linkedTaskIds) {
        await this.writeLinkedTasks(tx, existing.id, body.linkedTaskIds);
      }
    });

    await this.workspaceService.bumpUpdatedAt(workspaceId);
    await this.scheduleIndex(workspaceId, docId);
    return this.get(workspaceId, docId);
  }

  async remove(workspaceId: string, docId: string) {
    const existing = await this.requireInWorkspace(workspaceId, docId);
    await this.db.transaction(async (tx) => {
      await this.relations.deleteTouching(tx, workspaceId, [
        { type: RelationEntityType.DOC, ids: [existing.id] },
      ]);
      await tx.delete(docs).where(eq(docs.id, existing.id));
    });
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    await this.scheduleIndex(workspaceId, docId, true);
  }

  async readIndexText(
    workspaceId: string,
    docId: string,
  ): Promise<{ title: string; text: string } | null> {
    const [row] = await this.db
      .select()
      .from(docs)
      .where(and(eq(docs.id, docId), eq(docs.workspaceId, workspaceId)))
      .limit(1);
    if (!row) return null;
    const parts = [row.plainText.content, row.plainText.why].filter(
      (part): part is string => Boolean(part),
    );
    if (row.type === DocType.GOAL) {
      const body = readGoalDocBody(row.body);
      for (const criterion of [
        ...body.successCriteria,
        ...body.preconditions,
      ]) {
        parts.push(criterion.text);
      }
    }
    return { title: row.title, text: parts.join("\n\n") };
  }

  private async progressByGoal(goalIds: string[]) {
    const progress = new Map<string, number>();
    if (goalIds.length === 0) return progress;
    const links = await this.db
      .select({ docId: docTasks.docId, status: tasks.status })
      .from(docTasks)
      .innerJoin(tasks, eq(tasks.id, docTasks.taskId))
      .where(inArray(docTasks.docId, goalIds));
    const statusesByGoal = new Map<string, string[]>();
    for (const link of links) {
      const statuses = statusesByGoal.get(link.docId) ?? [];
      statuses.push(link.status);
      statusesByGoal.set(link.docId, statuses);
    }
    for (const goalId of goalIds) {
      progress.set(
        goalId,
        planningProgress(statusesByGoal.get(goalId) ?? []).progressPercent,
      );
    }
    return progress;
  }

  private async scheduleIndex(
    workspaceId: string,
    docId: string,
    removed = false,
  ): Promise<void> {
    await this.contentIndex?.enqueue({
      workspaceId,
      sourceType: "doc",
      sourceId: docId,
      removed,
    });
  }

  private mergeBody(existing: DocRow, patch: unknown): DocBody | null {
    if (patch === undefined) return null;
    if (existing.type === DocType.COMMON) {
      const parsed = UpdateCommonDocBodySchema.safeParse(patch);
      if (!parsed.success) {
        throw new BadRequestException(parsed.error.flatten());
      }
      return mergeCommonBody(existing.body as CommonDocBody, parsed.data);
    }
    const parsed = UpdateGoalDocBodySchema.safeParse(patch);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return mergeGoalBody(readGoalDocBody(existing.body), parsed.data);
  }

  private async projectBody(
    workspaceId: string,
    docId: string,
    body: DocBody,
  ): Promise<ProjectedDocBody> {
    const fields = proseFields(body);
    const mentions = fields.flatMap((field) => collectMentions(field.doc));
    const targets = await this.loadMentionTargets(workspaceId, mentions);
    const projected = fields.map((field) => {
      const next = projectProse(
        field.doc,
        (mention) => keepMention(mention, docId, targets),
        (mention) => mentionLabel(mention, targets),
      );
      return { key: field.key, doc: next.doc, plainText: next.plainText };
    });
    const kept = projected.flatMap((field) => collectMentions(field.doc));
    return {
      body: applyProjectedFields(body, projected),
      plainText: plainTextFor(body, projected),
      mentions: uniqueMentions(kept),
    };
  }

  private async loadMentionTargets(
    workspaceId: string,
    mentions: DocMentionRef[],
  ): Promise<MentionTargets> {
    const taskIds = uniqueIds(mentions, DocMentionTarget.TASK);
    const docIds = uniqueIds(mentions, DocMentionTarget.DOC);
    const epicIds = uniqueIds(mentions, DocMentionTarget.EPIC);
    const eventIds = uniqueIds(mentions, DocMentionTarget.EVENT);
    const taskTitles = new Map<string, string>();
    const docTitles = new Map<string, string>();
    const epicTitles = new Map<string, string>();
    const eventTitles = new Map<string, string>();

    if (taskIds.length > 0) {
      const rows = await this.db
        .select({ id: tasks.id, summary: tasks.summary })
        .from(tasks)
        .where(
          and(eq(tasks.workspaceId, workspaceId), inArray(tasks.id, taskIds)),
        );
      for (const row of rows) taskTitles.set(row.id, row.summary);
    }

    if (docIds.length > 0) {
      const rows = await this.db
        .select({ id: docs.id, title: docs.title })
        .from(docs)
        .where(
          and(eq(docs.workspaceId, workspaceId), inArray(docs.id, docIds)),
        );
      for (const row of rows) docTitles.set(row.id, row.title);
    }

    if (epicIds.length > 0) {
      const rows = await this.db
        .select({ id: epics.id, name: epics.name })
        .from(epics)
        .innerJoin(spaces, eq(spaces.id, epics.spaceId))
        .where(
          and(eq(spaces.workspaceId, workspaceId), inArray(epics.id, epicIds)),
        );
      for (const row of rows) epicTitles.set(row.id, row.name);
    }

    if (eventIds.length > 0) {
      const rows = await this.db
        .select({ id: calendarEvents.id, title: calendarEvents.title })
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.workspaceId, workspaceId),
            inArray(calendarEvents.id, eventIds),
          ),
        );
      for (const row of rows) eventTitles.set(row.id, row.title);
    }

    return { taskTitles, docTitles, epicTitles, eventTitles };
  }

  private async requireTasks(workspaceId: string, taskIds: string[]) {
    if (taskIds.length === 0) return;
    const rows = await this.db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(eq(tasks.workspaceId, workspaceId), inArray(tasks.id, taskIds)),
      );
    if (rows.length !== taskIds.length) {
      throw new BadRequestException(
        "One or more tasks are not in this workspace",
      );
    }
  }

  private async requireSpace(workspaceId: string, spaceId: string) {
    const [space] = await this.db
      .select({ id: spaces.id })
      .from(spaces)
      .where(and(eq(spaces.id, spaceId), eq(spaces.workspaceId, workspaceId)))
      .limit(1);
    if (!space) throw new ForbiddenException();
  }

  private async requireDocsFolder(
    workspaceId: string,
    folderId: string,
    spaceId: string,
  ) {
    const [folder] = await this.db
      .select()
      .from(docFolders)
      .where(eq(docFolders.id, folderId))
      .limit(1);
    if (!folder || folder.workspaceId !== workspaceId) {
      throw new ForbiddenException();
    }
    if (folder.spaceId !== spaceId) {
      throw new BadRequestException("Document folder is not in this space");
    }
  }

  private async folderForMove(
    existing: DocRow,
    body: UpdateDocBody,
    nextSpaceId: string,
  ) {
    if (body.folderId !== undefined) return body.folderId;
    if (!existing.folderId || nextSpaceId === existing.spaceId) {
      return existing.folderId;
    }
    const [folder] = await this.db
      .select({ spaceId: docFolders.spaceId })
      .from(docFolders)
      .where(eq(docFolders.id, existing.folderId))
      .limit(1);
    return folder?.spaceId === nextSpaceId ? existing.folderId : null;
  }

  private async requireInWorkspace(workspaceId: string, docId: string) {
    const [row] = await this.db
      .select()
      .from(docs)
      .where(eq(docs.id, docId))
      .limit(1);
    if (!row || row.workspaceId !== workspaceId) {
      throw new ForbiddenException();
    }
    return row;
  }

  private async linkedTaskIds(docId: string) {
    const rows = await this.db
      .select({ taskId: docTasks.taskId })
      .from(docTasks)
      .where(eq(docTasks.docId, docId));
    return rows.map((row) => row.taskId);
  }

  private async writeMentions(
    tx: DocsWriter,
    docId: string,
    mentions: DocMentionRef[],
  ) {
    await this.relations.replaceReferences(
      tx,
      await this.workspaceIdFor(tx, docId),
      "doc",
      docId,
      mentions,
    );
  }

  private async workspaceIdFor(tx: DocsWriter, docId: string) {
    const [row] = await tx
      .select({ workspaceId: docs.workspaceId })
      .from(docs)
      .where(eq(docs.id, docId))
      .limit(1);
    if (!row) throw new ForbiddenException();
    return row.workspaceId;
  }

  private async writeLinkedTasks(
    tx: DocsWriter,
    docId: string,
    taskIds: string[],
  ) {
    await tx.delete(docTasks).where(eq(docTasks.docId, docId));
    if (taskIds.length === 0) return;
    await tx.insert(docTasks).values(
      taskIds.map((taskId) => ({
        docId,
        taskId,
      })),
    );
  }
}

function proseFields(body: DocBody): ProseField[] {
  if ("content" in body) return [{ key: "content", doc: body.content }];
  return [{ key: "why", doc: body.why }];
}

function applyProjectedFields(
  body: DocBody,
  fields: ProjectedField[],
): DocBody {
  if ("content" in body) {
    const content = fields.find((field) => field.key === "content");
    return { content: content?.doc ?? body.content };
  }
  return {
    why: fieldDoc(fields, "why", body.why),
    successCriteria: body.successCriteria,
    preconditions: body.preconditions,
    status: body.status,
    deadline: body.deadline,
  };
}

function plainTextFor(body: DocBody, fields: ProjectedField[]): DocPlainText {
  if ("content" in body) {
    return { content: fieldText(fields, "content") };
  }
  return {
    why: fieldText(fields, "why"),
  };
}

function fieldDoc(
  fields: ProjectedField[],
  key: ProseFieldKey,
  fallback: ProseDoc,
) {
  return fields.find((field) => field.key === key)?.doc ?? fallback;
}

function fieldText(fields: ProjectedField[], key: ProseFieldKey) {
  return fields.find((field) => field.key === key)?.plainText ?? "";
}

function mergeCommonBody(
  existing: CommonDocBody,
  patch: UpdateCommonDocBody,
): CommonDocBody {
  return {
    content: patch.content ?? existing.content,
  };
}

function mergeGoalBody(
  existing: GoalDocBody,
  patch: UpdateGoalDocBody,
): GoalDocBody {
  return {
    why: patch.why ?? existing.why,
    successCriteria: patch.successCriteria ?? existing.successCriteria,
    preconditions: patch.preconditions ?? existing.preconditions,
    status: patch.status ?? existing.status,
    deadline: patch.deadline === undefined ? existing.deadline : patch.deadline,
  };
}

function keepMention(
  mention: DocMentionRef,
  docId: string,
  targets: MentionTargets,
) {
  if (mention.targetType === DocMentionTarget.EVENT) {
    return targets.eventTitles.has(mention.targetId);
  }
  if (mention.targetType === DocMentionTarget.EPIC) {
    return targets.epicTitles.has(mention.targetId);
  }
  if (mention.targetType === DocMentionTarget.TASK) {
    return targets.taskTitles.has(mention.targetId);
  }
  return mention.targetId !== docId && targets.docTitles.has(mention.targetId);
}

function mentionLabel(mention: DocMentionRef, targets: MentionTargets) {
  if (mention.targetType === DocMentionTarget.TASK) {
    return targets.taskTitles.get(mention.targetId) ?? "";
  }
  if (mention.targetType === DocMentionTarget.DOC) {
    return targets.docTitles.get(mention.targetId) ?? "";
  }
  if (mention.targetType === DocMentionTarget.EPIC) {
    return targets.epicTitles.get(mention.targetId) ?? "";
  }
  if (mention.targetType === DocMentionTarget.EVENT) {
    return targets.eventTitles.get(mention.targetId) ?? "";
  }
  return mention.label ?? "";
}

function uniqueIds(
  mentions: DocMentionRef[],
  targetType: DocMentionRef["targetType"],
) {
  return [
    ...new Set(
      mentions
        .filter((mention) => mention.targetType === targetType)
        .map((mention) => mention.targetId),
    ),
  ];
}

function uniqueMentions(mentions: DocMentionRef[]): DocMentionRef[] {
  const seen = new Set<string>();
  const unique: DocMentionRef[] = [];
  for (const mention of mentions) {
    const key = `${mention.targetType}:${mention.targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      targetType: mention.targetType,
      targetId: mention.targetId,
    });
  }
  return unique;
}

interface MentionTargets {
  taskTitles: Map<string, string>;
  docTitles: Map<string, string>;
  epicTitles: Map<string, string>;
  eventTitles: Map<string, string>;
}

interface ProseField {
  key: ProseFieldKey;
  doc: ProseDoc;
}

interface ProjectedField extends ProseField {
  plainText: string;
}

interface ProjectedDocBody {
  body: DocBody;
  plainText: DocPlainText;
  mentions: DocMentionRef[];
}

type ProseFieldKey = "content" | "why";

function formatDocKey(sequence: number) {
  return `D-${sequence}`;
}
type DocsWriter = NodePgDatabase;
