import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  DocType,
  RelationEntityType,
  RelationKind,
  RelationOrigin,
  type CreateRelationBody,
  type DocMentionRef,
  type RelationEndpoint,
  type RelationNeighbor,
} from "@repo/api/todex";

import { DRIZZLE_DB } from "../../db/tokens";
import {
  calendarEvents,
  docs,
  entityRelations,
  epics,
  spaces,
  tasks,
} from "../../db/schema";
import {
  dependsOnWouldCycle,
  isLinkableType,
  orderRelatedTo,
} from "./relation-graph";

@Injectable()
export class RelationsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async list(
    workspaceId: string,
    entityType: RelationEndpoint["type"],
    entityId: string,
  ): Promise<RelationNeighbor[]> {
    await this.requireEntity(workspaceId, entityType, entityId);
    const rows = await this.db
      .select()
      .from(entityRelations)
      .where(
        and(
          eq(entityRelations.workspaceId, workspaceId),
          or(
            and(
              eq(entityRelations.sourceType, entityType),
              eq(entityRelations.sourceId, entityId),
            ),
            and(
              eq(entityRelations.targetType, entityType),
              eq(entityRelations.targetId, entityId),
            ),
          ),
        ),
      );
    const neighbors: RelationNeighbor[] = [];
    for (const row of rows) {
      const incoming =
        row.targetType === entityType && row.targetId === entityId;
      if (row.kind === RelationKind.REFERENCES && !incoming) continue;
      const otherType = incoming ? row.sourceType : row.targetType;
      const otherId = incoming ? row.sourceId : row.targetId;
      if (!isLinkableType(otherType)) continue;
      const loaded = await this.loadEntity(
        workspaceId,
        otherType as RelationEndpoint["type"],
        otherId,
      );
      if (!loaded) continue;
      neighbors.push({
        id: row.id,
        kind: row.kind,
        entityType: otherType as RelationEndpoint["type"],
        entityId: otherId,
        title: loaded.title,
        spaceId: loaded.spaceId,
        spaceName: loaded.spaceName,
        direction: incoming ? "incoming" : "outgoing",
      });
    }
    return neighbors;
  }

  async create(workspaceId: string, body: CreateRelationBody) {
    if (body.kind === RelationKind.DEPENDS_ON) {
      return this.createDependsOn(workspaceId, body.source, body.target);
    }
    return this.createRelatedTo(workspaceId, body.source, body.target);
  }

  async remove(workspaceId: string, relationId: string) {
    const [row] = await this.db
      .select()
      .from(entityRelations)
      .where(eq(entityRelations.id, relationId))
      .limit(1);
    if (!row || row.workspaceId !== workspaceId) throw new ForbiddenException();
    if (row.kind === RelationKind.REFERENCES) {
      throw new BadRequestException(
        "Mention links are removed by editing the source",
      );
    }
    await this.db
      .delete(entityRelations)
      .where(eq(entityRelations.id, row.id));
  }

  async replaceReferences(
    tx: RelationsDb,
    workspaceId: string,
    sourceType: RelationEndpoint["type"],
    sourceId: string,
    mentions: DocMentionRef[],
  ) {
    await tx
      .delete(entityRelations)
      .where(
        and(
          eq(entityRelations.workspaceId, workspaceId),
          eq(entityRelations.sourceType, sourceType),
          eq(entityRelations.sourceId, sourceId),
          eq(entityRelations.kind, RelationKind.REFERENCES),
        ),
      );
    const kept = await this.keepStoredMentions(
      tx,
      workspaceId,
      sourceType,
      sourceId,
      mentions,
    );
    if (kept.length === 0) return;
    const now = new Date();
    await tx.insert(entityRelations).values(
      kept.map((mention) => ({
        id: randomUUID(),
        workspaceId,
        sourceType,
        sourceId,
        targetType: mention.targetType,
        targetId: mention.targetId,
        kind: RelationKind.REFERENCES,
        origin: RelationOrigin.MENTION,
        createdAt: now,
      })),
    );
  }

  async deleteTouching(
    tx: RelationsDb,
    workspaceId: string,
    groups: RelationGroup[],
  ) {
    for (const group of groups) {
      if (group.ids.length === 0) continue;
      await tx
        .delete(entityRelations)
        .where(
          and(
            eq(entityRelations.workspaceId, workspaceId),
            or(
              and(
                eq(entityRelations.sourceType, group.type),
                inArray(entityRelations.sourceId, group.ids),
              ),
              and(
                eq(entityRelations.targetType, group.type),
                inArray(entityRelations.targetId, group.ids),
              ),
            ),
          ),
        );
    }
  }

  async hop(
    workspaceId: string,
    entityType: "task" | "doc",
    entityId: string,
    limit: number,
  ): Promise<RelationEndpoint[]> {
    if (limit <= 0) return [];
    const rows = await this.db
      .select()
      .from(entityRelations)
      .where(
        and(
          eq(entityRelations.workspaceId, workspaceId),
          or(
            and(
              eq(entityRelations.sourceType, entityType),
              eq(entityRelations.sourceId, entityId),
            ),
            and(
              eq(entityRelations.targetType, entityType),
              eq(entityRelations.targetId, entityId),
            ),
          ),
        ),
      );
    const neighbors: RelationEndpoint[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      const incoming =
        row.targetType === entityType && row.targetId === entityId;
      const type = incoming ? row.sourceType : row.targetType;
      const id = incoming ? row.sourceId : row.targetId;
      if (!isLinkableType(type)) continue;
      const key = `${type}:${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const loaded = await this.loadEntity(
        workspaceId,
        type as RelationEndpoint["type"],
        id,
      );
      if (!loaded) continue;
      neighbors.push({ type: type as RelationEndpoint["type"], id });
      if (neighbors.length >= limit) break;
    }
    return neighbors;
  }

  private async createRelatedTo(
    workspaceId: string,
    left: RelationEndpoint,
    right: RelationEndpoint,
  ) {
    const ordered = orderRelatedTo(left, right);
    if (!ordered) throw new BadRequestException("A relation cannot point at itself");
    await this.requireEntity(workspaceId, ordered.source.type, ordered.source.id);
    await this.requireEntity(workspaceId, ordered.target.type, ordered.target.id);
    await this.db
      .insert(entityRelations)
      .values({
        id: randomUUID(),
        workspaceId,
        sourceType: ordered.source.type,
        sourceId: ordered.source.id,
        targetType: ordered.target.type,
        targetId: ordered.target.id,
        kind: RelationKind.RELATED_TO,
        origin: RelationOrigin.EXPLICIT,
        createdAt: new Date(),
      })
      .onConflictDoNothing({
        target: [
          entityRelations.workspaceId,
          entityRelations.sourceType,
          entityRelations.sourceId,
          entityRelations.targetType,
          entityRelations.targetId,
          entityRelations.kind,
        ],
      });
    const [row] = await this.db
      .select()
      .from(entityRelations)
      .where(
        and(
          eq(entityRelations.workspaceId, workspaceId),
          eq(entityRelations.sourceType, ordered.source.type),
          eq(entityRelations.sourceId, ordered.source.id),
          eq(entityRelations.targetType, ordered.target.type),
          eq(entityRelations.targetId, ordered.target.id),
          eq(entityRelations.kind, RelationKind.RELATED_TO),
        ),
      )
      .limit(1);
    if (!row) throw new ForbiddenException();
    return row;
  }

  private async createDependsOn(
    workspaceId: string,
    source: RelationEndpoint,
    target: RelationEndpoint,
  ) {
    if (
      source.type !== RelationEntityType.TASK ||
      target.type !== RelationEntityType.TASK
    ) {
      throw new BadRequestException("depends_on links tasks only");
    }
    if (source.id === target.id) {
      throw new BadRequestException("A task cannot depend on itself");
    }
    await this.requireEntity(workspaceId, source.type, source.id);
    await this.requireEntity(workspaceId, target.type, target.id);
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${workspaceId}), 0)`,
      );
      const [existing] = await tx
        .select()
        .from(entityRelations)
        .where(
          and(
            eq(entityRelations.workspaceId, workspaceId),
            eq(entityRelations.sourceType, RelationEntityType.TASK),
            eq(entityRelations.sourceId, source.id),
            eq(entityRelations.targetType, RelationEntityType.TASK),
            eq(entityRelations.targetId, target.id),
            eq(entityRelations.kind, RelationKind.DEPENDS_ON),
          ),
        )
        .limit(1);
      if (existing) return existing;
      const edges = await tx
        .select({
          sourceId: entityRelations.sourceId,
          targetId: entityRelations.targetId,
        })
        .from(entityRelations)
        .where(
          and(
            eq(entityRelations.workspaceId, workspaceId),
            eq(entityRelations.kind, RelationKind.DEPENDS_ON),
          ),
        );
      if (dependsOnWouldCycle(edges, source.id, target.id)) {
        throw new BadRequestException("That dependency would create a cycle");
      }
      const [created] = await tx
        .insert(entityRelations)
        .values({
          id: randomUUID(),
          workspaceId,
          sourceType: RelationEntityType.TASK,
          sourceId: source.id,
          targetType: RelationEntityType.TASK,
          targetId: target.id,
          kind: RelationKind.DEPENDS_ON,
          origin: RelationOrigin.EXPLICIT,
          createdAt: new Date(),
        })
        .returning();
      if (!created) throw new ForbiddenException();
      return created;
    });
  }

  private async keepStoredMentions(
    tx: RelationsDb,
    workspaceId: string,
    sourceType: string,
    sourceId: string,
    mentions: DocMentionRef[],
  ) {
    const unique = new Map<string, DocMentionRef>();
    for (const mention of mentions) {
      if (!isLinkableType(mention.targetType)) continue;
      if (mention.targetType === sourceType && mention.targetId === sourceId) {
        continue;
      }
      unique.set(`${mention.targetType}:${mention.targetId}`, {
        targetType: mention.targetType,
        targetId: mention.targetId,
      });
    }
    const candidates = [...unique.values()];
    const present = await this.presentTargets(tx, workspaceId, candidates);
    return candidates.filter((mention) =>
      present.has(`${mention.targetType}:${mention.targetId}`),
    );
  }

  private async presentTargets(
    tx: RelationsDb,
    workspaceId: string,
    mentions: DocMentionRef[],
  ) {
    const present = new Set<string>();
    const idsFor = (type: DocMentionRef["targetType"]) =>
      mentions
        .filter((mention) => mention.targetType === type)
        .map((mention) => mention.targetId);
    const taskIds = idsFor("task");
    const docIds = idsFor("doc");
    const epicIds = idsFor("epic");
    const eventIds = idsFor("event");
    if (taskIds.length > 0) {
      const rows = await tx
        .select({ id: tasks.id })
        .from(tasks)
        .where(
          and(eq(tasks.workspaceId, workspaceId), inArray(tasks.id, taskIds)),
        );
      for (const row of rows) present.add(`task:${row.id}`);
    }
    if (docIds.length > 0) {
      const rows = await tx
        .select({ id: docs.id })
        .from(docs)
        .where(
          and(eq(docs.workspaceId, workspaceId), inArray(docs.id, docIds)),
        );
      for (const row of rows) present.add(`doc:${row.id}`);
    }
    if (epicIds.length > 0) {
      const rows = await tx
        .select({ id: epics.id })
        .from(epics)
        .innerJoin(spaces, eq(spaces.id, epics.spaceId))
        .where(
          and(eq(spaces.workspaceId, workspaceId), inArray(epics.id, epicIds)),
        );
      for (const row of rows) present.add(`epic:${row.id}`);
    }
    if (eventIds.length > 0) {
      const rows = await tx
        .select({ id: calendarEvents.id })
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.workspaceId, workspaceId),
            inArray(calendarEvents.id, eventIds),
          ),
        );
      for (const row of rows) present.add(`event:${row.id}`);
    }
    return present;
  }

  private async requireEntity(
    workspaceId: string,
    type: RelationEndpoint["type"],
    id: string,
  ) {
    const loaded = await this.loadEntity(workspaceId, type, id);
    if (!loaded) throw new ForbiddenException();
    return loaded;
  }

  private async loadEntity(
    workspaceId: string,
    type: RelationEndpoint["type"],
    id: string,
  ): Promise<LoadedEntity | null> {
    if (type === RelationEntityType.TASK) {
      const [row] = await this.db
        .select({
          title: tasks.summary,
          spaceId: tasks.spaceId,
          spaceName: spaces.name,
        })
        .from(tasks)
        .innerJoin(spaces, eq(spaces.id, tasks.spaceId))
        .where(and(eq(tasks.id, id), eq(tasks.workspaceId, workspaceId)))
        .limit(1);
      return row ?? null;
    }
    if (type === RelationEntityType.DOC) {
      const [row] = await this.db
        .select({
          title: docs.title,
          type: docs.type,
          spaceId: docs.spaceId,
          spaceName: spaces.name,
        })
        .from(docs)
        .innerJoin(spaces, eq(spaces.id, docs.spaceId))
        .where(and(eq(docs.id, id), eq(docs.workspaceId, workspaceId)))
        .limit(1);
      if (!row) return null;
      return {
        title: row.type === DocType.GOAL ? row.title : row.title,
        spaceId: row.spaceId,
        spaceName: row.spaceName,
      };
    }
    if (type === RelationEntityType.EPIC) {
      const [row] = await this.db
        .select({
          title: epics.name,
          spaceId: epics.spaceId,
          spaceName: spaces.name,
        })
        .from(epics)
        .innerJoin(spaces, eq(spaces.id, epics.spaceId))
        .where(and(eq(epics.id, id), eq(spaces.workspaceId, workspaceId)))
        .limit(1);
      return row ?? null;
    }
    const [row] = await this.db
      .select({
        title: calendarEvents.title,
        spaceId: calendarEvents.spaceId,
        spaceName: spaces.name,
      })
      .from(calendarEvents)
      .leftJoin(spaces, eq(spaces.id, calendarEvents.spaceId))
      .where(
        and(
          eq(calendarEvents.id, id),
          eq(calendarEvents.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    if (!row) return null;
    return {
      title: row.title,
      spaceId: row.spaceId,
      spaceName: row.spaceName,
    };
  }
}

type RelationsDb = NodePgDatabase;

interface RelationGroup {
  type: (typeof RelationEntityType)[keyof typeof RelationEntityType];
  ids: string[];
}

interface LoadedEntity {
  title: string;
  spaceId: string | null;
  spaceName: string | null;
}
