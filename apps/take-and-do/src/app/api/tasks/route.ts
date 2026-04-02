import { TasksController } from "@/services/server/controllers";

const controller = new TasksController();

export const GET = controller.list;
export const POST = controller.create;
export const DELETE = controller.deleteAllForBoard;
