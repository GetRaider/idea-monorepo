import type { CalendarEvent } from "@/types/calendar.types";
import type {
  CalendarEventCreateBody,
  CalendarEventPatchBody,
} from "@/db/dtos/calendar-events.dto";

import { BaseClientService } from "./base.client.service";
import { Route } from "@/constants/route.constant";

export class CalendarEventsClientService extends BaseClientService {
  constructor() {
    super(Route.CALENDAR_EVENTS);
  }

  async list(from: Date, to: Date): Promise<CalendarEvent[]> {
    const result = await this.get<CalendarEvent[]>({
      queries: { from: from.toISOString(), to: to.toISOString() },
    });
    return this.isResultOk(result) ? result.data : [];
  }

  async create(body: CalendarEventCreateBody): Promise<CalendarEvent | null> {
    const result = await this.post<CalendarEvent>({ body });
    return this.isResultOk(result) ? result.data : null;
  }

  async update(
    id: string,
    body: CalendarEventPatchBody,
  ): Promise<CalendarEvent | null> {
    const result = await this.patch<CalendarEvent>({
      pathParams: [id],
      body,
    });
    return this.isResultOk(result) ? result.data : null;
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.delete<{ ok: true }>({ pathParams: [id] });
    return this.isResultOk(result);
  }
}
