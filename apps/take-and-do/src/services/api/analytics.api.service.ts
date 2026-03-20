import { BaseApiService } from "./base-api.service";

export class AnalyticsApiService extends BaseApiService {
  constructor() {
    super("/analytics");
  }

  async getStatsByTimeframe(timeframe: Timeframe): Promise<AnalyticsData[]> {
    const response = await this.get<AnalyticsData[]>({
      queries: { timeframe },
    });
    return response.data;
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
