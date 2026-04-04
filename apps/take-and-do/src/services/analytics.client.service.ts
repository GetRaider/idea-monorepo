import { TaskStatsInput } from "@/db/dtos";
import type { AnalyticsStats } from "@/server/services/ai";

import { BaseClientService } from "./base.client.service";

export class AnalyticsClientService extends BaseClientService {
  constructor() {
    super("/analytics");
  }

  async getStatsByTimeframe(
    timeframe: Timeframe,
  ): Promise<AnalyticsStats | null> {
    const result = await this.get<AnalyticsStatsResponse>({
      queries: { timeframe },
    });
    if (!this.isResultOk(result)) return null;
    return result.data.stats ?? null;
  }

  async generateSummary({
    stats,
    timeframe,
    shouldUseAI,
  }: GenerateSummaryInput): Promise<AnalyticsData | null> {
    const result = await this.post<GenerateSummaryResponse>({
      body: { stats, timeframe, shouldUseAI },
    });
    if (!this.isResultOk(result)) return null;
    return result.data.analytics ?? null;
  }
}

export interface AnalyticsData {
  summary: string;
  insights: string[];
  risks: string[];
  recommendations: string[];
  aiGenerated: boolean;
}

export type Timeframe = "all" | "week" | "month" | "quarter";

interface AnalyticsStatsResponse {
  timeframe: Timeframe;
  stats: AnalyticsStats;
}

interface GenerateSummaryInput {
  stats: TaskStatsInput;
  timeframe: Timeframe;
  shouldUseAI: boolean;
}

interface GenerateSummaryResponse {
  timeframe: Timeframe;
  stats: AnalyticsStats;
  analytics: AnalyticsData;
  aiGenerated: boolean;
}
