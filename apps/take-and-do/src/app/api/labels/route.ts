import { LabelsController } from "@/services/server/controllers";

const controller = new LabelsController();

export const GET = controller.list;
export const POST = controller.create;
export const PATCH = controller.rename;
export const DELETE = controller.remove;
