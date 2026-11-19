import { and, eq, isNull, max } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { positionAfterHighest } from "@repo/api/todex";

import { spaceFolders, spaces } from "../../db/schema";

export async function nextTopLevelPosition(
  db: Pick<NodePgDatabase, "select">,
  workspaceId: string,
) {
  const [folderRow] = await db
    .select({ value: max(spaceFolders.position) })
    .from(spaceFolders)
    .where(eq(spaceFolders.workspaceId, workspaceId));
  const [spaceRow] = await db
    .select({ value: max(spaces.position) })
    .from(spaces)
    .where(
      and(
        eq(spaces.workspaceId, workspaceId),
        isNull(spaces.spaceFolderId),
        eq(spaces.isInbox, false),
      ),
    );
  return positionAfterHighest(
    highestPosition(folderRow?.value, spaceRow?.value),
  );
}

export async function nextFolderSpacePosition(
  db: Pick<NodePgDatabase, "select">,
  workspaceId: string,
  folderId: string,
) {
  const [row] = await db
    .select({ value: max(spaces.position) })
    .from(spaces)
    .where(
      and(
        eq(spaces.workspaceId, workspaceId),
        eq(spaces.spaceFolderId, folderId),
      ),
    );
  return positionAfterHighest(readPosition(row?.value));
}

function highestPosition(folderPosition: unknown, spacePosition: unknown) {
  const values = [
    readPosition(folderPosition),
    readPosition(spacePosition),
  ].filter((value): value is number => value != null);
  if (values.length === 0) return null;
  return Math.max(...values);
}

function readPosition(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}
