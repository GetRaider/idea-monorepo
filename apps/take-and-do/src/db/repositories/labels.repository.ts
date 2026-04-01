import { eq } from "drizzle-orm";

import { labelsTable } from "@/db/schemas/label.schema";
import { genericHelper } from "@/helpers/generic.helper";
import { BaseRepository } from "@/db/repositories/base.repository";

export class LabelsRepository extends BaseRepository {
  async getAllLabels(): Promise<string[]> {
    const rows = await this.db.select().from(labelsTable);
    return rows.map((row) => row.name);
  }

  async addLabel(label: string): Promise<string> {
    const trimmedLabel = label.trim();

    const existingLabels = await this.db
      .select()
      .from(labelsTable)
      .where(eq(labelsTable.name, trimmedLabel));

    if (existingLabels.length > 0) return trimmedLabel;

    const labelId = genericHelper.generateId();
    await this.db.insert(labelsTable).values({
      id: labelId,
      name: trimmedLabel,
      createdAt: new Date(),
    });

    return trimmedLabel;
  }

  async renameLabel(oldName: string, newName: string): Promise<string> {
    const trimmedNew = newName.trim();
    if (!trimmedNew) throw new Error("Label name is required");
    if (trimmedNew === oldName) return oldName;

    const [existingOld] = await this.db
      .select()
      .from(labelsTable)
      .where(eq(labelsTable.name, oldName));

    if (!existingOld) throw new Error("Label not found");

    const [nameTaken] = await this.db
      .select()
      .from(labelsTable)
      .where(eq(labelsTable.name, trimmedNew));

    if (nameTaken) throw new Error("A label with that name already exists");

    await this.db
      .update(labelsTable)
      .set({ name: trimmedNew })
      .where(eq(labelsTable.name, oldName));

    return trimmedNew;
  }

  async deleteLabelByName(name: string): Promise<void> {
    const trimmed = name.trim();
    await this.db.delete(labelsTable).where(eq(labelsTable.name, trimmed));
  }
}
