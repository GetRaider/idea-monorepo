import { FoldersController } from "@/services/server/controllers";

const controller = new FoldersController();

export const GET = controller.list;
export const POST = controller.create;
