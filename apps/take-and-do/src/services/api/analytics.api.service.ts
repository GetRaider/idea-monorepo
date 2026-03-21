import { BaseApiService } from "./base-api.service";
import { AnalyticsStats } from "@/lib/ai";

export class AnalyticsApiService extends BaseApiService {
  constructor() {
    super("/analytics");
  }

  async getStatsByTimeframe(timeframe: Timeframe): Promise<AnalyticsStats> {
    const response = await this.get<AnalyticsStatsResponse>({
      queries: { timeframe },
    });
    return response.data.stats;
  }

  async generateSummary({
    stats,
    timeframe,
    shouldUseAI,
  }: GenerateSummaryInput): Promise<AnalyticsData> {
    const response = await this.post<GenerateSummaryResponse>({
      body: {
        stats,
        timeframe,
        shouldUseAI,
      },
    });
    return response.data.analytics;
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
  stats: AnalyticsStats;
  timeframe: Timeframe;
  shouldUseAI: boolean;
}

interface GenerateSummaryResponse {
  timeframe: Timeframe;
  stats: AnalyticsStats;
  analytics: AnalyticsData;
  aiGenerated: boolean;
}
