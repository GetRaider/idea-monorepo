import { CalendarEventsController } from "@/server/controllers";

const controller = new CalendarEventsController();

export const GET = controller.list;
export const POST = controller.create;
