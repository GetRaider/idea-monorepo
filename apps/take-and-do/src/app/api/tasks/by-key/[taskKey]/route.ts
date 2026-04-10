import { TasksController } from "@/server/controllers";

const controller = new TasksController();

export const GET = controller.getByKey;
