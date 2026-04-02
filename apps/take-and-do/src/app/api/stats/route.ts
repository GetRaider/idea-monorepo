import { StatsController } from "@/services/server/controllers";

const controller = new StatsController();

export const GET = controller.getCounts;
