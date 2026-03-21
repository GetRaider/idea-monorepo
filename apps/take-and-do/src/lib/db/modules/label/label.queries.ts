import { eq } from "drizzle-orm";
import { db } from "../../client";
import { labelsTable } from "./label.schema";
import { generateId } from "../utils";

export async function getAllLabels(): Promise<string[]> {
  const rows = await db.select().from(labelsTable);
  return rows.map((row) => row.name);
}

export async function addLabel(label: string): Promise<string> {
  const trimmedLabel = label.trim();

  const existingLabels = await db
    .select()
    .from(labelsTable)
    .where(eq(labelsTable.name, trimmedLabel));

  if (existingLabels.length > 0) {
    return trimmedLabel;
  }

  const labelId = generateId();
  await db.insert(labelsTable).values({
    id: labelId,
    name: trimmedLabel,
    createdAt: new Date(),
  });

  return trimmedLabel;
}

export async function renameLabel(
  oldName: string,
  newName: string,
): Promise<string> {
  const trimmedNew = newName.trim();
  if (!trimmedNew) {
    throw new Error("Label name is required");
  }
  if (trimmedNew === oldName) {
    return oldName;
  }

  const [existingOld] = await db
    .select()
    .from(labelsTable)
    .where(eq(labelsTable.name, oldName));

  if (!existingOld) {
    throw new Error("Label not found");
  }

  const [nameTaken] = await db
    .select()
    .from(labelsTable)
    .where(eq(labelsTable.name, trimmedNew));

  if (nameTaken) {
    throw new Error("A label with that name already exists");
  }

  await db
    .update(labelsTable)
    .set({ name: trimmedNew })
    .where(eq(labelsTable.name, oldName));

  return trimmedNew;
}

export async function deleteLabelByName(name: string): Promise<void> {
  const trimmed = name.trim();
  await db.delete(labelsTable).where(eq(labelsTable.name, trimmed));
}
