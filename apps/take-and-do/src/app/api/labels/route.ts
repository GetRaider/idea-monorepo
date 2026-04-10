import { LabelsController } from "@/server/controllers";

const controller = new LabelsController();

export const GET = controller.getAll;
export const POST = controller.create;
export const PATCH = controller.rename;
export const DELETE = controller.delete;
