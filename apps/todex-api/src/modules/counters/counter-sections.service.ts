import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { and, asc, eq, max } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { positionAfterHighest } from "@repo/api/todex";
import type {
  CounterSection,
  CreateCounterSectionBody,
  UpdateCounterSectionBody,
} from "@repo/api/todex";

import { counterSections, type CounterSectionRow } from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";

/** The user's own headings on the Counters page. */
@Injectable()
export class CounterSectionsService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async list(workspaceId: string): Promise<CounterSection[]> {
    const rows = await this.db
      .select()
      .from(counterSections)
      .where(eq(counterSections.workspaceId, workspaceId))
      .orderBy(
        asc(counterSections.position),
        asc(counterSections.createdAt),
        asc(counterSections.id),
      );
    return rows.map(toSection);
  }

  async create(
    workspaceId: string,
    body: CreateCounterSectionBody,
    now = new Date(),
  ): Promise<CounterSection> {
    const [last] = await this.db
      .select({ position: max(counterSections.position) })
      .from(counterSections)
      .where(eq(counterSections.workspaceId, workspaceId));
    const [row] = await this.db
      .insert(counterSections)
      .values({
        id: randomUUID(),
        workspaceId,
        // Zod infers optional keys without strict null checks.
        name: body.name!,
        position: positionAfterHighest(last?.position ?? null),
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return toSection(row!);
  }

  async update(
    workspaceId: string,
    sectionId: string,
    body: UpdateCounterSectionBody,
    now = new Date(),
  ): Promise<CounterSection> {
    const [row] = await this.db
      .update(counterSections)
      .set({ name: body.name, position: body.position, updatedAt: now })
      .where(inWorkspace(workspaceId, sectionId))
      .returning();
    if (!row) throw new NotFoundException("Section not found");
    return toSection(row);
  }

  /** Its Counters are kept; they move out of any section. */
  async remove(
    workspaceId: string,
    sectionId: string,
  ): Promise<{ ok: boolean }> {
    const removed = await this.db
      .delete(counterSections)
      .where(inWorkspace(workspaceId, sectionId))
      .returning({ id: counterSections.id });
    if (removed.length === 0) {
      throw new NotFoundException("Section not found");
    }
    return { ok: true };
  }
}

function inWorkspace(workspaceId: string, sectionId: string) {
  return and(
    eq(counterSections.id, sectionId),
    eq(counterSections.workspaceId, workspaceId),
  );
}

function toSection(row: CounterSectionRow): CounterSection {
  return { id: row.id, name: row.name, position: row.position };
}
