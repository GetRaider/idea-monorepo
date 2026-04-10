import { FoldersController } from "@/server/controllers";

const controller = new FoldersController();

export const GET = controller.getById;
export const PATCH = controller.update;
export const DELETE = controller.delete;
