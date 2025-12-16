import { eq } from "drizzle-orm";
import { db } from "../../client";
import { labels } from "./label.schema";
import { generateId } from "../utils";

export async function getAllLabels(): Promise<string[]> {
  const rows = await db.select().from(labels);
  return rows.map((row) => row.name);
}

export async function addLabel(label: string): Promise<string> {
  const trimmedLabel = label.trim();

  // Check if label already exists
  const existing = await db
    .select()
    .from(labels)
    .where(eq(labels.name, trimmedLabel));

  if (existing.length > 0) {
    return trimmedLabel;
  }

  // Create new label
  const labelId = generateId();
  await db.insert(labels).values({
    id: labelId,
    name: trimmedLabel,
    createdAt: new Date(),
  });

  return trimmedLabel;
}
