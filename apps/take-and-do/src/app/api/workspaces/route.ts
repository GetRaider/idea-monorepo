import { WorkspacesController } from "@/server/controllers";

const controller = new WorkspacesController();

export const GET = controller.get;
