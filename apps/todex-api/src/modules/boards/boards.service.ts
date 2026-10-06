import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  DEFAULT_AREA_NAME,
  PROGRESS_STAGE_TEMPLATES,
  type ApplyProgressStageTemplateBody,
  type CreateBoardAreaBody,
  type CreateTaskBoardBody,
  type ReplaceBoardProgressStagesBody,
  type UpdateBoardAreaBody,
  type UpdateTaskBoardBody,
} from "@repo/api/todex";

import {
  mapBoardArea,
  mapBoardProgressStage,
  mapTaskBoard,
} from "../../db/mappers";
import {
  boardAreas,
  boardProgressStages,
  taskBoards,
  tasks,
  type BoardAreaRow,
} from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";
import { WorkspaceService } from "../workspace/workspace.service";
import {
  planProgressStageReplace,
  ProgressStagePlanError,
} from "./progress-stage-plan";

@Injectable()
export class BoardsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async list(workspaceId: string, folderId?: string) {
    const rows = await this.db
      .select()
      .from(taskBoards)
      .where(
        folderId
          ? and(
              eq(taskBoards.workspaceId, workspaceId),
              eq(taskBoards.folderId, folderId),
            )
          : eq(taskBoards.workspaceId, workspaceId),
      );
    return rows.map(mapTaskBoard);
  }

  async get(workspaceId: string, boardId: string) {
    const board = await this.requireInWorkspace(workspaceId, boardId);
    const [areas, progressStages] = await Promise.all([
      this.listAreas(board.id),
      this.listProgressStages(board.id),
    ]);
    return { ...mapTaskBoard(board), areas, progressStages };
  }

  async create(workspaceId: string, body: CreateTaskBoardBody) {
    const now = new Date();
    const created = await this.db.transaction(async (tx) => {
      const [board] = await tx
        .insert(taskBoards)
        .values({
          id: randomUUID(),
          workspaceId,
          folderId: body.folderId ?? null,
          name: body.name,
          emoji: body.emoji ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (!board) throw new ForbiddenException();
      await tx.insert(boardAreas).values({
        id: randomUUID(),
        boardId: board.id,
        name: DEFAULT_AREA_NAME,
        position: 0,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });
      return board;
    });
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapTaskBoard(created);
  }

  async update(
    workspaceId: string,
    boardId: string,
    body: UpdateTaskBoardBody,
  ) {
    const existing = await this.requireInWorkspace(workspaceId, boardId);
    const [updated] = await this.db
      .update(taskBoards)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.folderId !== undefined ? { folderId: body.folderId } : {}),
        ...(body.emoji !== undefined ? { emoji: body.emoji } : {}),
        updatedAt: new Date(),
      })
      .where(eq(taskBoards.id, existing.id))
      .returning();
    if (!updated) throw new ForbiddenException();
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapTaskBoard(updated);
  }

  async remove(workspaceId: string, boardId: string) {
    const existing = await this.requireInWorkspace(workspaceId, boardId);
    await this.db.transaction(async (tx) => {
      await tx.delete(tasks).where(eq(tasks.taskBoardId, existing.id));
      await tx.delete(taskBoards).where(eq(taskBoards.id, existing.id));
    });
    await this.workspaceService.bumpUpdatedAt(workspaceId);
  }

  async createArea(
    workspaceId: string,
    boardId: string,
    body: CreateBoardAreaBody,
  ) {
    await this.requireInWorkspace(workspaceId, boardId);
    const areas = await this.areaRows(boardId);
    this.assertUniqueAreaName(areas, body.name);
    const now = new Date();
    const [created] = await this.db
      .insert(boardAreas)
      .values({
        id: randomUUID(),
        boardId,
        name: body.name,
        position: areas.length,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!created) throw new ForbiddenException();
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapBoardArea(created);
  }

  async updateArea(
    workspaceId: string,
    boardId: string,
    areaId: string,
    body: UpdateBoardAreaBody,
  ) {
    await this.requireInWorkspace(workspaceId, boardId);
    const areas = await this.areaRows(boardId);
    const area = areas.find((item) => item.id === areaId);
    if (!area) throw new ForbiddenException();
    if (body.name !== undefined) {
      this.assertUniqueAreaName(areas, body.name, area.id);
    }

    if (body.name !== undefined && body.position === undefined) {
      const now = new Date();
      const [updated] = await this.db
        .update(boardAreas)
        .set({ name: body.name, updatedAt: now })
        .where(eq(boardAreas.id, area.id))
        .returning();
      if (!updated) throw new ForbiddenException();
      await this.workspaceService.bumpUpdatedAt(workspaceId);
      return mapBoardArea(updated);
    }

    const ordered = moveRow(areas, area.id, body.position ?? area.position);
    const now = new Date();
    await this.db.transaction(async (tx) => {
      await this.parkAreaSlots(tx, ordered);
      for (let position = 0; position < ordered.length; position += 1) {
        const row = ordered[position];
        if (!row) continue;
        await tx
          .update(boardAreas)
          .set({
            position,
            ...(row.id === area.id && body.name !== undefined
              ? { name: body.name }
              : {}),
            updatedAt: now,
          })
          .where(eq(boardAreas.id, row.id));
      }
    });
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    const updated = (await this.areaRows(boardId)).find(
      (item) => item.id === area.id,
    );
    if (!updated) throw new ForbiddenException();
    return mapBoardArea(updated);
  }

  async removeArea(workspaceId: string, boardId: string, areaId: string) {
    await this.requireInWorkspace(workspaceId, boardId);
    const areas = await this.areaRows(boardId);
    const area = areas.find((item) => item.id === areaId);
    if (!area) throw new ForbiddenException();
    if (area.isDefault) {
      throw new BadRequestException("The default area cannot be deleted");
    }
    const fallback = areas.find((item) => item.isDefault);
    if (!fallback) throw new ForbiddenException();
    const remaining = areas.filter((item) => item.id !== area.id);
    const now = new Date();
    await this.db.transaction(async (tx) => {
      await tx
        .update(tasks)
        .set({ areaId: fallback.id, updatedAt: now })
        .where(eq(tasks.areaId, area.id));
      await tx.delete(boardAreas).where(eq(boardAreas.id, area.id));
      await this.parkAreaSlots(tx, remaining);
      for (let position = 0; position < remaining.length; position += 1) {
        const row = remaining[position];
        if (!row) continue;
        await tx
          .update(boardAreas)
          .set({ position, updatedAt: now })
          .where(eq(boardAreas.id, row.id));
      }
    });
    await this.workspaceService.bumpUpdatedAt(workspaceId);
  }

  async replaceProgressStages(
    workspaceId: string,
    boardId: string,
    body: ReplaceBoardProgressStagesBody,
  ) {
    await this.requireInWorkspace(workspaceId, boardId);
    const existing = await this.stageRows(boardId);
    let plan: ReturnType<typeof planProgressStageReplace>;
    try {
      plan = planProgressStageReplace(
        existing.map((stage) => stage.id),
        body.stages,
      );
    } catch (error) {
      if (error instanceof ProgressStagePlanError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const now = new Date();
    await this.db.transaction(async (tx) => {
      await this.parkStageSlots(tx, existing);
      if (plan.removeIds.length > 0) {
        for (const id of plan.removeIds) {
          await tx
            .delete(boardProgressStages)
            .where(eq(boardProgressStages.id, id));
        }
      }
      for (const stage of plan.updates) {
        if (!stage.id) continue;
        await tx
          .update(boardProgressStages)
          .set({ name: stage.name, position: stage.position, updatedAt: now })
          .where(eq(boardProgressStages.id, stage.id));
      }
      if (plan.inserts.length > 0) {
        await tx.insert(boardProgressStages).values(
          plan.inserts.map((stage) => ({
            id: randomUUID(),
            boardId,
            name: stage.name,
            position: stage.position,
            createdAt: now,
            updatedAt: now,
          })),
        );
      }
    });
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return this.listProgressStages(boardId);
  }

  async applyProgressStageTemplate(
    workspaceId: string,
    boardId: string,
    body: ApplyProgressStageTemplateBody,
  ) {
    const names = PROGRESS_STAGE_TEMPLATES[body.template];
    return this.replaceProgressStages(workspaceId, boardId, {
      stages: names.map((name) => ({ name })),
    });
  }

  async requireInWorkspace(workspaceId: string, boardId: string) {
    const [row] = await this.db
      .select()
      .from(taskBoards)
      .where(eq(taskBoards.id, boardId))
      .limit(1);
    if (!row || row.workspaceId !== workspaceId) {
      throw new ForbiddenException();
    }
    return row;
  }

  async defaultAreaId(boardId: string) {
    const [row] = await this.db
      .select({ id: boardAreas.id })
      .from(boardAreas)
      .where(
        and(eq(boardAreas.boardId, boardId), eq(boardAreas.isDefault, true)),
      )
      .limit(1);
    if (!row) throw new ForbiddenException();
    return row.id;
  }

  async areaBelongsToBoard(boardId: string, areaId: string) {
    const [row] = await this.db
      .select({ id: boardAreas.id })
      .from(boardAreas)
      .where(and(eq(boardAreas.id, areaId), eq(boardAreas.boardId, boardId)))
      .limit(1);
    return row != null;
  }

  async stageBelongsToBoard(boardId: string, stageId: string) {
    const [row] = await this.db
      .select({ id: boardProgressStages.id })
      .from(boardProgressStages)
      .where(
        and(
          eq(boardProgressStages.id, stageId),
          eq(boardProgressStages.boardId, boardId),
        ),
      )
      .limit(1);
    return row != null;
  }

  private async listAreas(boardId: string) {
    return (await this.areaRows(boardId)).map(mapBoardArea);
  }

  private async listProgressStages(boardId: string) {
    return (await this.stageRows(boardId)).map(mapBoardProgressStage);
  }

  private async areaRows(boardId: string) {
    return this.db
      .select()
      .from(boardAreas)
      .where(eq(boardAreas.boardId, boardId))
      .orderBy(asc(boardAreas.position), asc(boardAreas.id));
  }

  private async stageRows(boardId: string) {
    return this.db
      .select()
      .from(boardProgressStages)
      .where(eq(boardProgressStages.boardId, boardId))
      .orderBy(asc(boardProgressStages.position), asc(boardProgressStages.id));
  }

  private assertUniqueAreaName(
    areas: BoardAreaRow[],
    name: string,
    ignoreId?: string,
  ) {
    const key = name.toLowerCase();
    const taken = areas.some(
      (area) => area.id !== ignoreId && area.name.toLowerCase() === key,
    );
    if (taken) {
      throw new BadRequestException("An area with this name already exists");
    }
  }

  private async parkAreaSlots(tx: NodePgDatabase, rows: BoardAreaRow[]) {
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (!row) continue;
      await tx
        .update(boardAreas)
        .set({ position: -(index + 1) })
        .where(eq(boardAreas.id, row.id));
    }
  }

  private async parkStageSlots(tx: NodePgDatabase, rows: { id: string }[]) {
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (!row) continue;
      await tx
        .update(boardProgressStages)
        .set({ position: -(index + 1), name: `~${row.id}` })
        .where(eq(boardProgressStages.id, row.id));
    }
  }
}

function moveRow(rows: BoardAreaRow[], id: string, index: number) {
  const currentIndex = rows.findIndex((row) => row.id === id);
  if (currentIndex < 0) return rows;
  const next = rows.slice();
  const [moved] = next.splice(currentIndex, 1);
  if (!moved) return rows;
  const target = Math.min(Math.max(index, 0), next.length);
  next.splice(target, 0, moved);
  return next;
}
