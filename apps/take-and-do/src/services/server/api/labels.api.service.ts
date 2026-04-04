import { DB, eq, and } from "@/db/client";
import type { DataAccess } from "@/db/repositories/base.repository";
import { labelsTable } from "@/db/schemas";
import { genericHelper } from "@/helpers/generic.helper";

import { BaseApiService } from "@/services/server/api/base.api.service";

export class LabelsApiService extends BaseApiService {
  constructor(protected readonly db: DB) {
    super(db);
  }

  async getAll(access: DataAccess) {
    return this.handleOperation(async () => {
      if (access.isAnonymous) return [];
      const rows = await this.db
        .select({ name: labelsTable.name })
        .from(labelsTable)
        .where(eq(labelsTable.userId, access.userId));
      return rows.map((row) => row.name);
    });
  }

  async getOrCreateLabelIdsByNames(
    userId: string,
    names: string[],
  ): Promise<string[]> {
    return this.handleOperation(async () => {
      const orderedUniqueNames: string[] = [];
      const seen = new Set<string>();
      for (const raw of names) {
        const trimmed = raw.trim();
        if (!trimmed || seen.has(trimmed)) continue;
        seen.add(trimmed);
        orderedUniqueNames.push(trimmed);
      }

      const ids: string[] = [];
      for (const name of orderedUniqueNames) {
        ids.push(await this.findOrCreateLabelId(userId, name));
      }
      return ids;
    });
  }

  async findOrCreateLabelId(userId: string, rawName: string): Promise<string> {
    return this.handleOperation(async () => {
      const trimmedLabel = rawName.trim();
      if (!trimmedLabel) throw new Error("Label name is required");

      const [existing] = await this.db
        .select()
        .from(labelsTable)
        .where(
          and(
            eq(labelsTable.userId, userId),
            eq(labelsTable.name, trimmedLabel),
          ),
        )
        .limit(1);

      if (existing) return existing.id;

      const labelId = genericHelper.generateId();
      try {
        await this.db.insert(labelsTable).values({
          id: labelId,
          userId,
          name: trimmedLabel,
          createdAt: new Date(),
        });
        return labelId;
      } catch {
        const [again] = await this.db
          .select()
          .from(labelsTable)
          .where(
            and(
              eq(labelsTable.userId, userId),
              eq(labelsTable.name, trimmedLabel),
            ),
          )
          .limit(1);
        if (again) return again.id;
        throw new Error("Failed to create label");
      }
    });
  }

  async add(access: DataAccess, label: string) {
    return this.handleOperation(async () => {
      if (access.isAnonymous) throw new Error("Guest users cannot add labels");
      const trimmedLabel = label.trim();
      if (!trimmedLabel) throw new Error("Label name is required");

      const [existing] = await this.db
        .select()
        .from(labelsTable)
        .where(
          and(
            eq(labelsTable.userId, access.userId),
            eq(labelsTable.name, trimmedLabel),
          ),
        )
        .limit(1);

      if (existing) return trimmedLabel;

      await this.db.insert(labelsTable).values({
        id: genericHelper.generateId(),
        userId: access.userId,
        name: trimmedLabel,
        createdAt: new Date(),
      });

      return trimmedLabel;
    });
  }

  async rename(access: DataAccess, oldName: string, newName: string) {
    return this.handleOperation(async () => {
      if (access.isAnonymous)
        throw new Error("Guest users cannot rename labels");
      const trimmedNew = newName.trim();
      if (!trimmedNew) throw new Error("Label name is required");
      if (trimmedNew === oldName) return oldName;

      const [existingOld] = await this.db
        .select()
        .from(labelsTable)
        .where(
          and(
            eq(labelsTable.userId, access.userId),
            eq(labelsTable.name, oldName),
          ),
        );

      if (!existingOld) throw new Error("Label not found");

      const [nameTaken] = await this.db
        .select()
        .from(labelsTable)
        .where(
          and(
            eq(labelsTable.userId, access.userId),
            eq(labelsTable.name, trimmedNew),
          ),
        );

      if (nameTaken) throw new Error("A label with that name already exists");

      await this.db
        .update(labelsTable)
        .set({ name: trimmedNew })
        .where(
          and(
            eq(labelsTable.userId, access.userId),
            eq(labelsTable.name, oldName),
          ),
        );

      return trimmedNew;
    });
  }

  async delete(access: DataAccess, name: string) {
    return this.handleOperation(async () => {
      if (access.isAnonymous)
        throw new Error("Guest users cannot delete labels");
      const trimmed = name.trim();
      await this.db
        .delete(labelsTable)
        .where(
          and(
            eq(labelsTable.userId, access.userId),
            eq(labelsTable.name, trimmed),
          ),
        );
    });
  }

  protected override mapError(error: unknown): never {
    const message = error instanceof Error ? error.message : "";
    if (message === "Label not found") this.notFound("Label");
    if (message === "Label name is required") this.badRequest(message);
    if (message === "A label with that name already exists")
      this.conflict(message);
    throw error;
  }
}
