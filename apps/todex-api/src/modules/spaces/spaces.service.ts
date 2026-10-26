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
  DEFAULT_SECTION_NAME,
  PROGRESS_STAGE_TEMPLATES,
  type ApplyProgressStageTemplateBody,
  type CreateSpaceSectionBody,
  type CreateSpaceBody,
  type ReplaceSpaceProgressStagesBody,
  type UpdateSpaceSectionBody,
  type UpdateSpaceBody,
} from "@repo/api/todex";

import {
  mapSpaceSection,
  mapSpaceProgressStage,
  mapSpace,
} from "../../db/mappers";
import {
  epics,
  spaceSections,
  spaceProgressStages,
  spaces,
  tasks,
  type SpaceSectionRow,
} from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";
import { WorkspaceService } from "../workspace/workspace.service";
import {
  planProgressStageReplace,
  ProgressStagePlanError,
} from "./progress-stage-plan";

@Injectable()
export class SpacesService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly workspaceService: WorkspaceService,
  ) {}

  async list(workspaceId: string, folderId?: string) {
    const rows = await this.db
      .select()
      .from(spaces)
      .where(
        folderId
          ? and(
              eq(spaces.workspaceId, workspaceId),
              eq(spaces.folderId, folderId),
            )
          : eq(spaces.workspaceId, workspaceId),
      );
    return rows.map(mapSpace);
  }

  async get(workspaceId: string, spaceId: string) {
    const board = await this.requireInWorkspace(workspaceId, spaceId);
    const [areas, progressStages] = await Promise.all([
      this.listSections(board.id),
      this.listProgressStages(board.id),
    ]);
    return { ...mapSpace(board), sections: areas, progressStages };
  }

  async create(workspaceId: string, body: CreateSpaceBody) {
    const now = new Date();
    const created = await this.db.transaction(async (tx) => {
      const [board] = await tx
        .insert(spaces)
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
      await tx.insert(spaceSections).values({
        id: randomUUID(),
        spaceId: board.id,
        name: DEFAULT_SECTION_NAME,
        position: 0,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });
      return board;
    });
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapSpace(created);
  }

  async update(workspaceId: string, spaceId: string, body: UpdateSpaceBody) {
    const existing = await this.requireInWorkspace(workspaceId, spaceId);
    const [updated] = await this.db
      .update(spaces)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.folderId !== undefined ? { folderId: body.folderId } : {}),
        ...(body.emoji !== undefined ? { emoji: body.emoji } : {}),
        updatedAt: new Date(),
      })
      .where(eq(spaces.id, existing.id))
      .returning();
    if (!updated) throw new ForbiddenException();
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapSpace(updated);
  }

  async remove(workspaceId: string, spaceId: string) {
    const existing = await this.requireInWorkspace(workspaceId, spaceId);
    await this.db.transaction(async (tx) => {
      await tx.delete(tasks).where(eq(tasks.spaceId, existing.id));
      await tx.delete(spaces).where(eq(spaces.id, existing.id));
    });
    await this.workspaceService.bumpUpdatedAt(workspaceId);
  }

  async createSection(
    workspaceId: string,
    spaceId: string,
    body: CreateSpaceSectionBody,
  ) {
    await this.requireInWorkspace(workspaceId, spaceId);
    const areas = await this.sectionRows(spaceId);
    this.assertUniqueSectionName(areas, body.name);
    const now = new Date();
    const [created] = await this.db
      .insert(spaceSections)
      .values({
        id: randomUUID(),
        spaceId,
        name: body.name,
        position: areas.length,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!created) throw new ForbiddenException();
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return mapSpaceSection(created);
  }

  async updateSection(
    workspaceId: string,
    spaceId: string,
    sectionId: string,
    body: UpdateSpaceSectionBody,
  ) {
    await this.requireInWorkspace(workspaceId, spaceId);
    const areas = await this.sectionRows(spaceId);
    const area = areas.find((item) => item.id === sectionId);
    if (!area) throw new ForbiddenException();
    if (body.name !== undefined) {
      this.assertUniqueSectionName(areas, body.name, area.id);
    }

    if (body.name !== undefined && body.position === undefined) {
      const now = new Date();
      const [updated] = await this.db
        .update(spaceSections)
        .set({ name: body.name, updatedAt: now })
        .where(eq(spaceSections.id, area.id))
        .returning();
      if (!updated) throw new ForbiddenException();
      await this.workspaceService.bumpUpdatedAt(workspaceId);
      return mapSpaceSection(updated);
    }

    const ordered = moveRow(areas, area.id, body.position ?? area.position);
    const now = new Date();
    await this.db.transaction(async (tx) => {
      await this.parkSectionSlots(tx, ordered);
      for (let position = 0; position < ordered.length; position += 1) {
        const row = ordered[position];
        if (!row) continue;
        await tx
          .update(spaceSections)
          .set({
            position,
            ...(row.id === area.id && body.name !== undefined
              ? { name: body.name }
              : {}),
            updatedAt: now,
          })
          .where(eq(spaceSections.id, row.id));
      }
    });
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    const updated = (await this.sectionRows(spaceId)).find(
      (item) => item.id === area.id,
    );
    if (!updated) throw new ForbiddenException();
    return mapSpaceSection(updated);
  }

  async removeSection(workspaceId: string, spaceId: string, sectionId: string) {
    await this.requireInWorkspace(workspaceId, spaceId);
    const areas = await this.sectionRows(spaceId);
    const area = areas.find((item) => item.id === sectionId);
    if (!area) throw new ForbiddenException();
    if (area.isDefault) {
      throw new BadRequestException("The default section cannot be deleted");
    }
    const fallback = areas.find((item) => item.isDefault);
    if (!fallback) throw new ForbiddenException();
    const remaining = areas.filter((item) => item.id !== area.id);
    const now = new Date();
    await this.db.transaction(async (tx) => {
      await tx
        .update(tasks)
        .set({ sectionId: fallback.id, updatedAt: now })
        .where(eq(tasks.sectionId, area.id));
      await tx
        .update(epics)
        .set({ sectionId: fallback.id, updatedAt: now })
        .where(eq(epics.sectionId, area.id));
      await tx.delete(spaceSections).where(eq(spaceSections.id, area.id));
      await this.parkSectionSlots(tx, remaining);
      for (let position = 0; position < remaining.length; position += 1) {
        const row = remaining[position];
        if (!row) continue;
        await tx
          .update(spaceSections)
          .set({ position, updatedAt: now })
          .where(eq(spaceSections.id, row.id));
      }
    });
    await this.workspaceService.bumpUpdatedAt(workspaceId);
  }

  async replaceProgressStages(
    workspaceId: string,
    spaceId: string,
    body: ReplaceSpaceProgressStagesBody,
  ) {
    await this.requireInWorkspace(workspaceId, spaceId);
    const existing = await this.stageRows(spaceId);
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
            .delete(spaceProgressStages)
            .where(eq(spaceProgressStages.id, id));
        }
      }
      for (const stage of plan.updates) {
        if (!stage.id) continue;
        await tx
          .update(spaceProgressStages)
          .set({ name: stage.name, position: stage.position, updatedAt: now })
          .where(eq(spaceProgressStages.id, stage.id));
      }
      if (plan.inserts.length > 0) {
        await tx.insert(spaceProgressStages).values(
          plan.inserts.map((stage) => ({
            id: randomUUID(),
            spaceId,
            name: stage.name,
            position: stage.position,
            createdAt: now,
            updatedAt: now,
          })),
        );
      }
    });
    await this.workspaceService.bumpUpdatedAt(workspaceId);
    return this.listProgressStages(spaceId);
  }

  async applyProgressStageTemplate(
    workspaceId: string,
    spaceId: string,
    body: ApplyProgressStageTemplateBody,
  ) {
    const names = PROGRESS_STAGE_TEMPLATES[body.template];
    return this.replaceProgressStages(workspaceId, spaceId, {
      stages: names.map((name) => ({ name })),
    });
  }

  async requireInWorkspace(workspaceId: string, spaceId: string) {
    const [row] = await this.db
      .select()
      .from(spaces)
      .where(eq(spaces.id, spaceId))
      .limit(1);
    if (!row || row.workspaceId !== workspaceId) {
      throw new ForbiddenException();
    }
    return row;
  }

  async defaultSectionId(spaceId: string) {
    const [row] = await this.db
      .select({ id: spaceSections.id })
      .from(spaceSections)
      .where(
        and(
          eq(spaceSections.spaceId, spaceId),
          eq(spaceSections.isDefault, true),
        ),
      )
      .limit(1);
    if (!row) throw new ForbiddenException();
    return row.id;
  }

  async sectionBelongsToSpace(spaceId: string, sectionId: string) {
    const [row] = await this.db
      .select({ id: spaceSections.id })
      .from(spaceSections)
      .where(
        and(
          eq(spaceSections.id, sectionId),
          eq(spaceSections.spaceId, spaceId),
        ),
      )
      .limit(1);
    return row != null;
  }

  async stageBelongsToSpace(spaceId: string, stageId: string) {
    const [row] = await this.db
      .select({ id: spaceProgressStages.id })
      .from(spaceProgressStages)
      .where(
        and(
          eq(spaceProgressStages.id, stageId),
          eq(spaceProgressStages.spaceId, spaceId),
        ),
      )
      .limit(1);
    return row != null;
  }

  private async listSections(spaceId: string) {
    return (await this.sectionRows(spaceId)).map(mapSpaceSection);
  }

  private async listProgressStages(spaceId: string) {
    return (await this.stageRows(spaceId)).map(mapSpaceProgressStage);
  }

  private async sectionRows(spaceId: string) {
    return this.db
      .select()
      .from(spaceSections)
      .where(eq(spaceSections.spaceId, spaceId))
      .orderBy(asc(spaceSections.position), asc(spaceSections.id));
  }

  private async stageRows(spaceId: string) {
    return this.db
      .select()
      .from(spaceProgressStages)
      .where(eq(spaceProgressStages.spaceId, spaceId))
      .orderBy(asc(spaceProgressStages.position), asc(spaceProgressStages.id));
  }

  private assertUniqueSectionName(
    areas: SpaceSectionRow[],
    name: string,
    ignoreId?: string,
  ) {
    const key = name.toLowerCase();
    const taken = areas.some(
      (area) => area.id !== ignoreId && area.name.toLowerCase() === key,
    );
    if (taken) {
      throw new BadRequestException("A section with this name already exists");
    }
  }

  private async parkSectionSlots(tx: NodePgDatabase, rows: SpaceSectionRow[]) {
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (!row) continue;
      await tx
        .update(spaceSections)
        .set({ position: -(index + 1) })
        .where(eq(spaceSections.id, row.id));
    }
  }

  private async parkStageSlots(tx: NodePgDatabase, rows: { id: string }[]) {
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (!row) continue;
      await tx
        .update(spaceProgressStages)
        .set({ position: -(index + 1), name: `~${row.id}` })
        .where(eq(spaceProgressStages.id, row.id));
    }
  }
}

function moveRow(rows: SpaceSectionRow[], id: string, index: number) {
  const currentIndex = rows.findIndex((row) => row.id === id);
  if (currentIndex < 0) return rows;
  const next = rows.slice();
  const [moved] = next.splice(currentIndex, 1);
  if (!moved) return rows;
  const target = Math.min(Math.max(index, 0), next.length);
  next.splice(target, 0, moved);
  return next;
}
