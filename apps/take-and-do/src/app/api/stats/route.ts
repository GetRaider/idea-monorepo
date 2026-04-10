import { StatsController } from "@/server/controllers";

const controller = new StatsController();

export const GET = controller.getCounts;
