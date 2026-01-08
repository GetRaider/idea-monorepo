export interface AnalyticsData {
  summary: string;
  insights: string[];
  risks: string[];
  recommendations: string[];
  aiGenerated: boolean;
}

export type Timeframe = "week" | "month" | "quarter";

