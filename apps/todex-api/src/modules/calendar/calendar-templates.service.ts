import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { randomUUID } from "crypto";
import type {
  CreateCalendarEventTemplateBody,
  UpdateCalendarEventTemplateBody,
} from "@repo/api/todex";

import { mapCalendarEventTemplate } from "../../db/mappers";
import { calendarEventTemplates, tasks } from "../../db/schema";
import { DRIZZLE_DB } from "../../db/tokens";

@Injectable()
export class CalendarTemplatesService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: NodePgDatabase) {}

  async list(workspaceId: string) {
    const rows = await this.db
      .select()
      .from(calendarEventTemplates)
      .where(eq(calendarEventTemplates.workspaceId, workspaceId))
      .orderBy(desc(calendarEventTemplates.updatedAt));
    return rows.map(mapCalendarEventTemplate);
  }

  async create(workspaceId: string, body: CreateCalendarEventTemplateBody) {
    await this.requireTasks(workspaceId, body.taskScope ?? []);
    const now = new Date();
    const [created] = await this.db
      .insert(calendarEventTemplates)
      .values({
        id: randomUUID(),
        workspaceId,
        title: body.title,
        durationMinutes: body.durationMinutes,
        color: body.color ?? null,
        description: body.description ?? "",
        taskScope: body.taskScope ?? [],
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!created) throw new NotFoundException("Calendar template");
    return mapCalendarEventTemplate(created);
  }

  async update(
    workspaceId: string,
    templateId: string,
    body: UpdateCalendarEventTemplateBody,
  ) {
    await this.require(workspaceId, templateId);
    if (body.taskScope) await this.requireTasks(workspaceId, body.taskScope);
    const [updated] = await this.db
      .update(calendarEventTemplates)
      .set({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.durationMinutes !== undefined
          ? { durationMinutes: body.durationMinutes }
          : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.taskScope !== undefined ? { taskScope: body.taskScope } : {}),
        updatedAt: new Date(),
      })
      .where(eq(calendarEventTemplates.id, templateId))
      .returning();
    if (!updated) throw new NotFoundException("Calendar template");
    return mapCalendarEventTemplate(updated);
  }

  async remove(workspaceId: string, templateId: string) {
    await this.require(workspaceId, templateId);
    await this.db
      .delete(calendarEventTemplates)
      .where(eq(calendarEventTemplates.id, templateId));
  }

  private async require(workspaceId: string, templateId: string) {
    const [row] = await this.db
      .select()
      .from(calendarEventTemplates)
      .where(
        and(
          eq(calendarEventTemplates.id, templateId),
          eq(calendarEventTemplates.workspaceId, workspaceId),
        ),
      );
    if (!row) throw new NotFoundException("Calendar template");
    return row;
  }

  private async requireTasks(workspaceId: string, taskIds: string[]) {
    if (taskIds.length === 0) return;
    const rows = await this.db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(eq(tasks.workspaceId, workspaceId), inArray(tasks.id, taskIds)),
      );
    if (rows.length !== new Set(taskIds).size) {
      throw new BadRequestException("Unknown task in scope");
    }
  }
}
