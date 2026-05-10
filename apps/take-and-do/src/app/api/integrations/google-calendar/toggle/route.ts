import { GoogleCalendarIntegrationController } from "@/server/controllers";

const controller = new GoogleCalendarIntegrationController();

export const POST = controller.toggle;
