import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, asc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  CreateKnowledgeDatabase,
  CreateKnowledgeProperty,
  KnowledgeCellValue,
  KnowledgePropertyType,
  PatchKnowledgeCell,
  UpdateKnowledgeProperty,
  UpdateKnowledgeView,
} from "@repo/api/todex";
import {
  knowledgeDatabases,
  knowledgeDatabaseProperties,
  knowledgeDatabaseRows,
  knowledgeDatabaseViews,
  spaces,
} from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";

type PropertyRow = typeof knowledgeDatabaseProperties.$inferSelect;

export function validateKnowledgeCell(
  property: Pick<PropertyRow, "type" | "options">,
  value: KnowledgeCellValue,
): KnowledgeCellValue {
  if (value === null) return null;
  switch (property.type) {
    case "title":
    case "text":
      if (typeof value === "string") return value;
      break;
    case "number":
      if (typeof value === "number" && Number.isFinite(value)) return value;
      break;
    case "checkbox":
      if (typeof value === "boolean") return value;
      break;
    case "date":
      if (typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(value) &&
          !Number.isNaN(Date.parse(value)) &&
          new Date(value).toISOString().slice(0, 10) === value) return value;
      break;
    case "select":
      if (typeof value === "string" && property.options.includes(value)) return value;
      break;
    case "multi_select":
      if (Array.isArray(value) && value.every(
        (v) => typeof v === "string" && property.options.includes(v),
      ) && new Set(value).size === value.length) return value;
      break;
  }
  throw new BadRequestException("Cell value does not match its property type or options");
}

function validateOptions(options: string[]) {
  if (new Set(options.map((item) => item.toLowerCase())).size !== options.length) {
    throw new BadRequestException("Property options must be unique");
  }
}

@Injectable()
export class KnowledgeDatabasesService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  private async requireDatabase(workspaceId: string, databaseId: string) {
    const [database] = await this.db.select().from(knowledgeDatabases)
      .where(and(eq(knowledgeDatabases.id, databaseId), eq(knowledgeDatabases.workspaceId, workspaceId)))
      .limit(1);
    if (!database) throw new NotFoundException("Knowledge database not found");
    return database;
  }

  private async requireProperty(databaseId: string, propertyId: string) {
    const [property] = await this.db.select().from(knowledgeDatabaseProperties)
      .where(and(
        eq(knowledgeDatabaseProperties.databaseId, databaseId),
        eq(knowledgeDatabaseProperties.id, propertyId),
      )).limit(1);
    if (!property) throw new NotFoundException("Property not found");
    return property;
  }

  async get(workspaceId: string, databaseId: string) {
    const database = await this.requireDatabase(workspaceId, databaseId);
    const [properties, rows, views] = await Promise.all([
      this.db.select().from(knowledgeDatabaseProperties)
        .where(eq(knowledgeDatabaseProperties.databaseId, databaseId))
        .orderBy(asc(knowledgeDatabaseProperties.position)),
      this.db.select().from(knowledgeDatabaseRows)
        .where(eq(knowledgeDatabaseRows.databaseId, databaseId))
        .orderBy(asc(knowledgeDatabaseRows.position)),
      this.db.select().from(knowledgeDatabaseViews)
        .where(eq(knowledgeDatabaseViews.databaseId, databaseId)),
    ]);
    const view = views[0];
    if (!view) throw new NotFoundException("Database view not found");
    return {
      id: database.id,
      workspaceId: database.workspaceId,
      spaceId: database.spaceId,
      name: database.name,
      properties: properties.map((p) => ({
        id: p.id, databaseId: p.databaseId, name: p.name, type: p.type,
        options: p.options, position: p.position,
      })),
      rows: rows.map((row) => ({
        id: row.id, databaseId: row.databaseId, cells: row.cells,
        position: row.position, updatedAt: row.updatedAt.toISOString(),
      })),
      view: {
        id: view.id, databaseId: view.databaseId, name: view.name,
        kind: view.kind, sorts: view.sorts, filters: view.filters,
      },
    };
  }

  async create(workspaceId: string, body: CreateKnowledgeDatabase) {
    const [space] = await this.db.select({ id: spaces.id }).from(spaces)
      .where(and(eq(spaces.id, body.spaceId), eq(spaces.workspaceId, workspaceId))).limit(1);
    if (!space) throw new ForbiddenException("Space is outside this workspace");
    const id = randomUUID();
    await this.db.transaction(async (tx) => {
      await tx.insert(knowledgeDatabases).values({
        id, workspaceId, spaceId: body.spaceId, name: body.name,
      });
      await tx.insert(knowledgeDatabaseProperties).values({
        id: randomUUID(), databaseId: id, name: "Name",
        type: "title", options: [], position: 0,
      });
      await tx.insert(knowledgeDatabaseViews).values({
        id: randomUUID(), databaseId: id, name: "Table", kind: "table",
        sorts: [], filters: [],
      });
    });
    return this.get(workspaceId, id);
  }

  async addProperty(workspaceId: string, databaseId: string, body: CreateKnowledgeProperty) {
    await this.requireDatabase(workspaceId, databaseId);
    validateOptions(body.options);
    const propertyId = randomUUID();
    await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${databaseId}))`);
      const props = await tx.select().from(knowledgeDatabaseProperties)
        .where(eq(knowledgeDatabaseProperties.databaseId, databaseId));
      if (props.length >= 50) throw new BadRequestException("Maximum 50 properties");
      if (props.some((p) => p.name.toLowerCase() === body.name.toLowerCase())) {
        throw new BadRequestException("Property name already exists");
      }
      await tx.insert(knowledgeDatabaseProperties).values({
        id: propertyId, databaseId, name: body.name,
        type: body.type, options: body.options,
        position: Math.max(-1, ...props.map((p) => p.position)) + 1,
      });
    });
    return this.get(workspaceId, databaseId);
  }

  async updateProperty(
    workspaceId: string, databaseId: string, propertyId: string,
    body: UpdateKnowledgeProperty,
  ) {
    await this.requireDatabase(workspaceId, databaseId);
    await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${databaseId}))`);
      const [property] = await tx.select().from(knowledgeDatabaseProperties)
        .where(and(eq(knowledgeDatabaseProperties.id, propertyId),
          eq(knowledgeDatabaseProperties.databaseId, databaseId))).limit(1);
      if (!property) throw new NotFoundException("Property not found");
      if (property.type === "title" && body.type) {
        throw new BadRequestException("Title property type cannot be changed");
      }
      const nextType: KnowledgePropertyType = body.type ?? property.type;
      const nextOptions = body.options ?? property.options;
      validateOptions(nextOptions);
      if (body.name && body.name !== property.name) {
        const other = await tx.select().from(knowledgeDatabaseProperties)
          .where(eq(knowledgeDatabaseProperties.databaseId, databaseId));
        if (other.some((p) => p.id !== propertyId && p.name.toLowerCase() === body.name!.toLowerCase())) {
          throw new BadRequestException("Property name already exists");
        }
      }
      if (nextType !== property.type) {
        const rows = await tx.select().from(knowledgeDatabaseRows)
          .where(eq(knowledgeDatabaseRows.databaseId, databaseId));
        if (rows.some((row) => {
          const value = row.cells[propertyId];
          return value !== undefined && value !== null && value !== "" &&
            (!Array.isArray(value) || value.length > 0);
        })) throw new BadRequestException("Clear existing cell values before changing the property type");
      }
      const rows = await tx.select().from(knowledgeDatabaseRows)
        .where(eq(knowledgeDatabaseRows.databaseId, databaseId));
      for (const row of rows) {
        const value = row.cells[propertyId];
        if (value !== undefined && value !== null) {
          validateKnowledgeCell({ type: nextType, options: nextOptions }, value);
        }
      }
      await tx.update(knowledgeDatabaseProperties)
        .set({ ...(body.name ? { name: body.name } : {}), type: nextType, options: nextOptions })
        .where(eq(knowledgeDatabaseProperties.id, propertyId));
    });
    return this.get(workspaceId, databaseId);
  }

  async deleteProperty(workspaceId: string, databaseId: string, propertyId: string) {
    await this.requireDatabase(workspaceId, databaseId);
    await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${databaseId}))`);
      const [property] = await tx.select().from(knowledgeDatabaseProperties)
        .where(and(eq(knowledgeDatabaseProperties.id, propertyId),
          eq(knowledgeDatabaseProperties.databaseId, databaseId))).limit(1);
      if (!property) throw new NotFoundException("Property not found");
      if (property.type === "title") throw new BadRequestException("Cannot remove title property");
      await tx.delete(knowledgeDatabaseProperties).where(eq(knowledgeDatabaseProperties.id, propertyId));
      const rows = await tx.select().from(knowledgeDatabaseRows)
        .where(eq(knowledgeDatabaseRows.databaseId, databaseId));
      for (const row of rows) {
        if (!(propertyId in row.cells)) continue;
        const cells = { ...row.cells };
        delete cells[propertyId];
        await tx.update(knowledgeDatabaseRows).set({ cells })
          .where(eq(knowledgeDatabaseRows.id, row.id));
      }
      const views = await tx.select().from(knowledgeDatabaseViews)
        .where(eq(knowledgeDatabaseViews.databaseId, databaseId));
      for (const view of views) {
        await tx.update(knowledgeDatabaseViews).set({
          sorts: view.sorts.filter((s) => s.propertyId !== propertyId),
          filters: view.filters.filter((f) => f.propertyId !== propertyId),
        }).where(eq(knowledgeDatabaseViews.id, view.id));
      }
    });
    return this.get(workspaceId, databaseId);
  }

  async addRow(workspaceId: string, databaseId: string) {
    await this.requireDatabase(workspaceId, databaseId);
    await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${databaseId}))`);
      const rows = await tx.select({ position: knowledgeDatabaseRows.position })
        .from(knowledgeDatabaseRows).where(eq(knowledgeDatabaseRows.databaseId, databaseId));
      if (rows.length >= 5000) throw new BadRequestException("Maximum 5000 rows");
      await tx.insert(knowledgeDatabaseRows).values({
        id: randomUUID(), databaseId, cells: {},
        position: Math.max(-1, ...rows.map((row) => row.position)) + 1,
      });
    });
    return this.get(workspaceId, databaseId);
  }

  async patchCell(
    workspaceId: string, databaseId: string, rowId: string, body: PatchKnowledgeCell,
  ) {
    await this.requireDatabase(workspaceId, databaseId);
    const property = await this.requireProperty(databaseId, body.propertyId);
    const value = validateKnowledgeCell(property, body.value);
    await this.db.transaction(async (tx) => {
      const [row] = await tx.select().from(knowledgeDatabaseRows)
        .where(and(eq(knowledgeDatabaseRows.id, rowId),
          eq(knowledgeDatabaseRows.databaseId, databaseId))).limit(1).for("update");
      if (!row) throw new NotFoundException("Database row not found");
      await tx.update(knowledgeDatabaseRows)
        .set({ cells: { ...row.cells, [body.propertyId]: value }, updatedAt: new Date() })
        .where(eq(knowledgeDatabaseRows.id, rowId));
    });
    return this.get(workspaceId, databaseId);
  }

  async removeRow(workspaceId: string, databaseId: string, rowId: string) {
    await this.requireDatabase(workspaceId, databaseId);
    const removed = await this.db.delete(knowledgeDatabaseRows)
      .where(and(eq(knowledgeDatabaseRows.id, rowId),
        eq(knowledgeDatabaseRows.databaseId, databaseId))).returning({ id: knowledgeDatabaseRows.id });
    if (removed.length === 0) throw new NotFoundException("Database row not found");
    return this.get(workspaceId, databaseId);
  }

  async updateView(workspaceId: string, databaseId: string, body: UpdateKnowledgeView) {
    const database = await this.get(workspaceId, databaseId);
    const propertyIds = new Set(database.properties.map((p) => p.id));
    for (const sort of body.sorts ?? []) {
      if (!propertyIds.has(sort.propertyId)) throw new BadRequestException("Unknown sort property");
    }
    for (const filter of body.filters ?? []) {
      if (!propertyIds.has(filter.propertyId)) throw new BadRequestException("Unknown filter property");
      if (filter.operator !== "is_empty" && filter.operator !== "not_empty" &&
          filter.value === undefined) {
        throw new BadRequestException("Filter value is required");
      }
      if (filter.operator === "greater_than" || filter.operator === "less_than") {
        const property = database.properties.find((p) => p.id === filter.propertyId);
        if (property?.type !== "date" && property?.type !== "number") {
          throw new BadRequestException("Comparison requires number or date property");
        }
      }
    }
    await this.db.update(knowledgeDatabaseViews).set({
      ...(body.sorts ? { sorts: body.sorts } : {}),
      ...(body.filters ? { filters: body.filters } : {}),
    }).where(eq(knowledgeDatabaseViews.id, database.view.id));
    return this.get(workspaceId, databaseId);
  }
}
