import { z } from "zod";

import { getAccessByAuth, requireNonAnonymous } from "@/auth/guards";
import {
  CalendarEventCreateBodySchema,
  CalendarEventPatchBodySchema,
  CalendarEventsListQueryDto,
} from "@/db/dtos";
import { BadRequestError, NotFoundError } from "@/lib/api/errors";
import { apiServices } from "@/server/services/api";

import { BaseController } from "./base.controller";

const eventIdParamsSchema = z.object({ id: z.string().min(1) });

export class CalendarEventsController extends BaseController {
  list = this.initRoute({
    queryDto: CalendarEventsListQueryDto,
    handler: async ({ query }) => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      const from = new Date(query.from);
      const to = new Date(query.to);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        throw new BadRequestError("Invalid from or to");
      }
      if (from.getTime() >= to.getTime()) {
        throw new BadRequestError("to must be after from");
      }
      return apiServices.calendarEvents.listOverlapping(from, to, access);
    },
  });

  create = this.initRoute({
    bodyDto: CalendarEventCreateBodySchema,
    handler: async ({ body }) => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      const created = await apiServices.calendarEvents.create(body, access);
      if (!created)
        throw new BadRequestError("Could not create calendar event");
      return created;
    },
    status: 201,
  });

  patch = this.initRoute({
    paramsDto: eventIdParamsSchema,
    bodyDto: CalendarEventPatchBodySchema,
    handler: async ({ params: { id }, body }) => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      const updated = await apiServices.calendarEvents.updateById(
        id,
        body,
        access,
      );
      if (!updated) throw new NotFoundError("Calendar event");
      return updated;
    },
  });

  remove = this.initRoute({
    paramsDto: eventIdParamsSchema,
    responseDto: z.object({ ok: z.literal(true) }),
    handler: async ({ params: { id } }) => {
      const auth = await requireNonAnonymous();
      const access = getAccessByAuth(auth);
      const ok = await apiServices.calendarEvents.deleteById(id, access);
      if (!ok) throw new NotFoundError("Calendar event");
      return { ok: true as const };
    },
  });
}
