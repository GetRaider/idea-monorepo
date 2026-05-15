import { CalendarEventsController } from "@/server/controllers";

const controller = new CalendarEventsController();

export const PATCH = controller.patch;
export const DELETE = controller.remove;
