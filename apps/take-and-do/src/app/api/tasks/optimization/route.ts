import { TasksController } from "@/services/server/controllers";

const controller = new TasksController();

export const POST = controller.optimize;
