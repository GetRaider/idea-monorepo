import { AnalyticsController } from "@/services/server/controllers";

const controller = new AnalyticsController();

export const GET = controller.getStatistics;
export const POST = controller.generate;
