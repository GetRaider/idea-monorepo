import { TasksController } from "@/services/server/controllers";

const controller = new TasksController();

export const GET = controller.getById;
export const PATCH = controller.update;
export const DELETE = controller.delete;
