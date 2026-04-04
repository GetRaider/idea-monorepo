import { TaskBoardsController } from "@/server/controllers";

const controller = new TaskBoardsController();

export const GET = controller.getByQuery;
export const POST = controller.create;
export const PATCH = controller.update;
export const DELETE = controller.delete;
