import { ProgressController } from "@/server/controllers/progress.controller";

const controller = new ProgressController();

export const GET = controller.get;

