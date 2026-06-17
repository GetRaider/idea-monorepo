import type { FocusBacklogItem, FocusSessionRecord } from "@/types/focus.types";

import { BaseClientService } from "./base.client.service";
import { Route } from "@/constants/route.constant";

export type FocusStatePayload = {
  sessions: FocusSessionRecord[];
  backlog: FocusBacklogItem[];
};

export class FocusClientService extends BaseClientService {
  constructor() {
    super(Route.FOCUS);
  }

  async getState(): Promise<FocusStatePayload | null> {
    const result = await this.get<FocusStatePayload>();
    if (!this.isResultOk(result)) return null;
    return result.data;
  }

  async createState(
    payload: Partial<FocusStatePayload>,
  ): Promise<FocusStatePayload | null> {
    const result = await this.post<FocusStatePayload>({ body: payload });
    if (!this.isResultOk(result)) return null;
    return result.data;
  }

  async updateState(
    payload: Partial<FocusStatePayload> & {
      appendSession?: FocusSessionRecord;
      appendBacklogItem?: FocusBacklogItem;
    },
  ): Promise<FocusStatePayload | null> {
    const result = await this.patch<FocusStatePayload>({ body: payload });
    if (!this.isResultOk(result)) return null;
    return result.data;
  }

  async deleteState(): Promise<boolean> {
    const result = await this.delete<unknown>();
    return result.ok;
  }
}
