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
