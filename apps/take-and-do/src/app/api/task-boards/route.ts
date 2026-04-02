import { TaskBoardsController } from "@/services/server/controllers";

const controller = new TaskBoardsController();

export const GET = controller.listOrGetOne;
export const POST = controller.create;
export const PATCH = controller.update;
export const DELETE = controller.delete;
