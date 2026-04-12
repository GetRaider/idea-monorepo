import { and, eq, ne, sql } from "drizzle-orm";

import { foldersTable } from "@/db/schemas/folder.schema";
import { taskBoardsTable } from "@/db/schemas/taskBoard.schema";
import {
  BaseApiService,
  DataAccess,
} from "@/server/services/api/base.api.service";

/**
 * Boards and folders share a single namespace per user (case-insensitive trimmed name).
 */
export class WorkspaceApiService extends BaseApiService {
  /**
   * Returns true if another board or folder already uses this name (for the same user).
   */
  async isNameTaken(
    access: DataAccess,
    nameTrimmed: string,
    exclude?: { boardId?: string; folderId?: string },
  ): Promise<boolean> {
    if (access.isAnonymous) return false;

    const normalized = nameTrimmed.trim().toLowerCase();
    if (!normalized) return false;

    const boardConditions = [
      eq(taskBoardsTable.userId, access.userId),
      sql`lower(trim(${taskBoardsTable.name})) = ${normalized}`,
    ];
    if (exclude?.boardId) {
      boardConditions.push(ne(taskBoardsTable.id, exclude.boardId));
    }

    const folderConditions = [
      eq(foldersTable.userId, access.userId),
      sql`lower(trim(${foldersTable.name})) = ${normalized}`,
    ];
    if (exclude?.folderId) {
      folderConditions.push(ne(foldersTable.id, exclude.folderId));
    }

    const [boardHit, folderHit] = await Promise.all([
      this.db
        .select({ id: taskBoardsTable.id })
        .from(taskBoardsTable)
        .where(and(...boardConditions))
        .limit(1),
      this.db
        .select({ id: foldersTable.id })
        .from(foldersTable)
        .where(and(...folderConditions))
        .limit(1),
    ]);

    return boardHit.length > 0 || folderHit.length > 0;
  }
}
