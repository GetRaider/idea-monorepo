import { FoldersController } from "@/server/controllers";

const controller = new FoldersController();

export const GET = controller.getAll;
export const POST = controller.create;
