import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { TaskPriority, TaskStatus } from "@repo/api/todex";
import type {
  CreateEpicBody,
  Epic,
  EpicDetail,
  PlanningProgress,
  UpdateEpicBody,
} from "@repo/api/todex";

import { mapTask } from "../../db/mappers";
import {
  docTasks,
  epics,
  tasks,
  type EpicRow,
  type TaskRow,
} from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";
import { SpacesService } from "../spaces/spaces.service";
import { planningProgress } from "./progress";

@Injectable()
export class EpicsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase,
    private readonly spacesService: SpacesService,
  ) {}

  async list(workspaceId: string, spaceId: string): Promise<Epic[]> {
    await this.spacesService.requireInWorkspace(workspaceId, spaceId);
    const rows = await this.db
      .select()
      .from(epics)
      .where(eq(epics.spaceId, spaceId));
    const progress = await this.progressByEpic(rows.map((row) => row.id));
    return rows.map((row) => mapEpic(row, progress.get(row.id)));
  }

  async get(workspaceId: string, epicId: string): Promise<EpicDetail> {
    const epic = await this.requireEpic(workspaceId, epicId);
    const rows = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.epicId, epic.id));
    const mapped = await this.mapTasks(rows);
    const progress = planningProgress(mapped.map((task) => task.status));
    return { epic: mapEpic(epic, progress), tasks: mapped };
  }

  async create(
    workspaceId: string,
    spaceId: string,
    body: CreateEpicBody,
  ): Promise<Epic> {
    await this.spacesService.requireInWorkspace(workspaceId, spaceId);
    const existing = await this.db
      .select({ id: epics.id, name: epics.name })
      .from(epics)
      .where(eq(epics.spaceId, spaceId));
    assertUniqueName(
      existing,
      body.name,
      "An epic with this name already exists",
    );
    const sectionId =
      body.sectionId ?? (await this.spacesService.defaultSectionId(spaceId));
    if (!(await this.spacesService.sectionBelongsToSpace(spaceId, sectionId))) {
      throw new BadRequestException("Section is not in this space");
    }
    const now = new Date();
    const [created] = await this.db
      .insert(epics)
      .values({
        id: randomUUID(),
        spaceId,
        sectionId,
        name: body.name,
        description: body.description,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!created) throw new ForbiddenException();
    return mapEpic(created, planningProgress([]));
  }

  async update(
    workspaceId: string,
    epicId: string,
    body: UpdateEpicBody,
  ): Promise<Epic> {
    const existing = await this.requireEpic(workspaceId, epicId);
    if (body.name !== undefined) {
      const siblings = await this.db
        .select({ id: epics.id, name: epics.name })
        .from(epics)
        .where(eq(epics.spaceId, existing.spaceId));
      assertUniqueName(
        siblings,
        body.name,
        "An epic with this name already exists",
        existing.id,
      );
    }
    if (
      body.sectionId !== undefined &&
      !(await this.spacesService.sectionBelongsToSpace(
        existing.spaceId,
        body.sectionId,
      ))
    ) {
      throw new BadRequestException("Section is not in this space");
    }
    const [updated] = await this.db
      .update(epics)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.sectionId !== undefined ? { sectionId: body.sectionId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(epics.id, existing.id))
      .returning();
    if (!updated) throw new ForbiddenException();
    const progress = await this.progressByEpic([updated.id]);
    return mapEpic(updated, progress.get(updated.id));
  }

  async remove(workspaceId: string, epicId: string) {
    const existing = await this.requireEpic(workspaceId, epicId);
    await this.db.delete(epics).where(eq(epics.id, existing.id));
  }

  async requireEpic(workspaceId: string, epicId: string) {
    const [epic] = await this.db
      .select()
      .from(epics)
      .where(eq(epics.id, epicId))
      .limit(1);
    if (!epic) throw new ForbiddenException();
    await this.spacesService.requireInWorkspace(workspaceId, epic.spaceId);
    return epic;
  }

  private async progressByEpic(epicIds: string[]) {
    if (epicIds.length === 0) return new Map<string, PlanningProgress>();
    const rows = await this.db
      .select({ id: tasks.epicId, status: tasks.status })
      .from(tasks)
      .where(inArray(tasks.epicId, epicIds));
    const grouped = new Map<string, string[]>();
    for (const row of rows) {
      if (!row.id) continue;
      const statuses = grouped.get(row.id) ?? [];
      statuses.push(row.status);
      grouped.set(row.id, statuses);
    }
    return new Map(
      epicIds.map((epicId) => [
        epicId,
        planningProgress(grouped.get(epicId) ?? []),
      ]),
    );
  }

  private async mapTasks(rows: TaskRow[]) {
    if (rows.length === 0) return [];
    const links = await this.db
      .select({ taskId: docTasks.taskId, docId: docTasks.docId })
      .from(docTasks)
      .where(
        inArray(
          docTasks.taskId,
          rows.map((row) => row.id),
        ),
      );
    const goalByTaskId = new Map<string, string>();
    for (const link of links) {
      if (!goalByTaskId.has(link.taskId)) {
        goalByTaskId.set(link.taskId, link.docId);
      }
    }
    return rows.map((row) => mapTask(row, goalByTaskId.get(row.id) ?? null, 0));
  }
}

function assertUniqueName(
  rows: { id: string; name: string }[],
  name: string,
  message: string,
  ignoreId?: string,
) {
  const key = name.toLowerCase();
  const taken = rows.some(
    (row) => row.id !== ignoreId && row.name.toLowerCase() === key,
  );
  if (taken) throw new BadRequestException(message);
}

function mapEpic(row: EpicRow, progress: PlanningProgress | undefined): Epic {
  return {
    id: row.id,
    spaceId: row.spaceId,
    sectionId: row.sectionId,
    name: row.name,
    description: row.description,
    status: row.status,
    priority: row.priority,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    progress: progress ?? planningProgress([]),
  };
}
