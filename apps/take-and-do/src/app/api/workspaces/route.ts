import { WorkspacesController } from "@/services/server/controllers";

const controller = new WorkspacesController();

export const GET = controller.get;
