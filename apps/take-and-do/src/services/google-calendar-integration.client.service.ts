import { Route } from "@/constants/route.constant";
import type { CalendarEvent } from "@/types/calendar.types";

import type { ApiResult } from "./api-result.types";
import { BaseClientService } from "./base.client.service";

export type GoogleCalendarIntegrationStatus = {
  connected: boolean;
  googleLinked: boolean;
  email: string | null;
  enabled: boolean;
  lastSyncAt: string | null;
};

export type GoogleCalendarSyncResult = {
  imported: CalendarEvent[];
  lastSyncAt: string;
  incremental: boolean;
  syncRange?: { timeMin: string; timeMax: string };
  googleCalendarColor?: string;
};

export class GoogleCalendarIntegrationClientService extends BaseClientService {
  constructor() {
    super(Route.INTEGRATIONS_GOOGLE_CALENDAR);
  }

  getStatus(): Promise<ApiResult<GoogleCalendarIntegrationStatus>> {
    return this.get<GoogleCalendarIntegrationStatus>({});
  }

  setToggleEnabled(
    enabled: boolean,
  ): Promise<ApiResult<GoogleCalendarIntegrationStatus>> {
    return this.post<GoogleCalendarIntegrationStatus>({
      pathParams: ["toggle"],
      body: { enabled },
    });
  }

  sync(): Promise<ApiResult<GoogleCalendarSyncResult>> {
    return this.post<GoogleCalendarSyncResult>({
      pathParams: ["sync"],
    });
  }

  pushEvent(body: Record<string, unknown>): Promise<ApiResult<{ ok: true }>> {
    return this.post<{ ok: true }>({
      pathParams: ["push"],
      body,
    });
  }

  deleteEvent(body: Record<string, unknown>): Promise<ApiResult<{ ok: true }>> {
    return this.post<{ ok: true }>({
      pathParams: ["delete"],
      body,
    });
  }

  createEvent(body: object): Promise<ApiResult<{ event: CalendarEvent }>> {
    return this.post<{ event: CalendarEvent }>({
      pathParams: ["create"],
      body,
    });
  }

  disconnect(): Promise<ApiResult<unknown>> {
    return this.post<unknown>({
      pathParams: ["disconnect"],
    });
  }
}
