import { FocusController } from "@/server/controllers";

const controller = new FocusController();

export const GET = controller.getState;
export const POST = controller.createState;
export const PATCH = controller.updateState;
export const DELETE = controller.deleteState;
